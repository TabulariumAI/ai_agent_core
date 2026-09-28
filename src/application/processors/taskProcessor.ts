import { Service } from "typedi";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";
import type { IndexService } from "../../infrastructure/services/indexService";
import { Readable } from "stream";

export interface TaskDetail {
    task: Entities.Task;
    date: Date;
}

@Service()
export abstract class TaskProcessor {

    private readonly processingCount: number = 20;
    private readonly timeoutSeconds: number = 600;

    protected abstract batchType: Entities.BatchType;
    protected abstract context: Entities.WorkflowContext;
    protected abstract choice: Entities.Choice;
    protected abstract indexCallback: string;
    protected abstract reportRoot: string;
    protected abstract batchInRoot: string;
    private tasks: TaskDetail[] = [];
    private processingPromise: Promise<void> | null = null;
    private isProcessing = false;
    private tasksLock: Promise<void> = Promise.resolve();

    protected abstract batchRepository: Interfaces.IBatchRepository;
    protected abstract batchSourceRepository: Interfaces.IBatchSourceRepository;
    protected abstract batchClient: Interfaces.IBatchClient;
    protected abstract indexService: IndexService;
    protected abstract logger: Interfaces.ILogger;


    /**
     * Tries to finalize a batch if there are no more tasks associated with it.
     * @param batchName The name of the batch to finalize.
     */
    async tryFinalizeBatch(batchName: string): Promise<void> {
        if (!this.tasks.find(t => t.task.batch.name === batchName)) {
            this.logger.info(`No more tasks found for batch ${batchName}. Finalizing batch.`);
            await this.batchRepository.setBatchStatus({ name: batchName, type: this.batchType }, Entities.BatchStatus.Finalized);
            const report = await this.batchRepository.getBatchReport({ name: batchName, type: this.batchType });
            await this.batchSourceRepository.setReport(this.reportRoot, batchName, report);
        }
    }

    /**
     * Filters out tasks that are no longer in a queued, sent, or pending status.
     */
    async filterTasks(): Promise<void> {
        await this.withTasksLock(() => {
            this.tasks = this.tasks.filter(t => t.task.status == Entities.TaskStatus.Queued
                || t.task.status == Entities.TaskStatus.Sent
                || t.task.status == Entities.TaskStatus.Pending);
        });
    }

    /**
     * Updates the status of a specific task in the processing queue.
     * @param taskId The ID of the task to update.
     * @param status The new status to set for the task.
     */
    async updateTaskStatus(taskId: string, status: Entities.TaskStatus): Promise<void> {
        const task = this.tasks.find(t => t.task.id === taskId);
        if (task) {
            task.date = new Date();
            task.task.status = status;
            await this.batchRepository.setTaskStatus(task.task, status);
        }
    }
    /**
     * Adds new tasks to the processing queue.
     * @param tasks An array of tasks to add.
     */
    async addTasks(tasks: Entities.Task[]): Promise<void> {
        await this.withTasksLock(() => {
            this.logger.info(`Adding ${tasks.length} tasks to the processing queue.`);
            tasks.forEach(task => {
                this.tasks.push({ task, date: new Date() });
            });
        });
    }
    /**
     * Executes a given operation while ensuring exclusive access to the tasks queue.
     * @param operation The operation to execute.
     * @returns The result of the operation.
     */
    private async withTasksLock<T>(operation: () => T | Promise<T>): Promise<T> {
        const previousTaskOperation = this.tasksLock;
        let releaseTaskOperation!: () => void;
        this.tasksLock = new Promise<void>(resolve => {
            releaseTaskOperation = resolve;
        });

        await previousTaskOperation;
        try {
            return await operation();
        }
        finally {
            releaseTaskOperation();
        }
    }
    /**
     * Starts the queue loop, or joins the existing loop if already running.
     * @returns A promise that resolves after the loop exits, not when it starts.
     */
    public async processTasks(): Promise<void> {
        if (!this.processingPromise) {
            this.isProcessing = true;
            this.processingPromise = this.runProcessingLoop().finally(() => {
                this.processingPromise = null;
            });
        }

        return this.processingPromise;
    }

    /** Requests exit and waits for the current iteration; does not drain the queue. */
    public stopProcessing(): Promise<void> {
        this.isProcessing = false;
        return this.processingPromise ?? Promise.resolve();
    }

    /**
     * Finalizes a task as successful.
     * @param taskId The ID of the task to finalize.
     */
    public async finalizeTaskSuccess(taskId: string): Promise<void> {

        this.logger.info(`Finalizing task with taskId ${taskId} as success.`);
        const taskDetail = this.tasks.find(t => t.task.id === taskId);
        if (!taskDetail) {
            this.logger.error(`Task with taskId ${taskId} not found in processing tasks.`);
            throw new Error(`Task with taskId ${taskId} not found in processing tasks.`);
        }
        await this.updateTaskStatus(taskId, Entities.TaskStatus.Success);
        await this.filterTasks();
        await this.tryFinalizeBatch(taskDetail.task.batch.name);

    }

    /**
     * Finalizes a task as failed.
     * @param taskId The ID of the task to finalize.
     * @param error The error message associated with the failure.
     */
    public async finalizeTaskFailure(taskId: string, error: string): Promise<void> {
        this.logger.info(`Finalizing task with taskId ${taskId} as failure. Error: ${error}`);
        const taskDetail = this.tasks.find(t => t.task.id === taskId);
        if (!taskDetail) {
            this.logger.error(`Task with taskId ${taskId} not found in processing tasks.`);
            throw new Error(`Task with taskId ${taskId} not found in processing tasks.`);
        }
        await this.updateTaskStatus(taskId, Entities.TaskStatus.Failed);
        await this.filterTasks();
        await this.tryFinalizeBatch(taskDetail.task.batch.name);
    }


    /**
     * The main processing loop that handles task execution, deferring, and finalization.
     * This loop runs continuously until the processing is stopped.
     */
    private async runProcessingLoop(): Promise<void> {
        while (this.isProcessing) {
            try {
                const deferredTasks = this.tasks.filter(t => t.task.status === Entities.TaskStatus.Pending && t.date.getTime() < (new Date().getTime() - this.timeoutSeconds * 1000));
                let deferedBatches = Array.from(new Set(deferredTasks.map(t => t.task.batch.name)));
                if (deferredTasks.length > 0) {
                    this.logger.info(`Deferring ${deferredTasks.length} tasks due to timeout.`);
                }
                for (const task of deferredTasks) {
                    await this.updateTaskStatus(task.task.id, Entities.TaskStatus.Deferred);
                }
                const tempTasks: TaskDetail[] = [];
                await this.filterTasks();
                await this.withTasksLock(async () => {
                    tempTasks.push(...this.tasks);
                });
                for (const batchName of deferedBatches) {
                    await this.tryFinalizeBatch(batchName);
                }

                let taskDetail: TaskDetail | null = null;

                // Check if there are any tasks in Started Status
                const queuedTasks = tempTasks.filter(t => t.task.status === Entities.TaskStatus.Queued).sort((a, b) => a.task.id.localeCompare(b.task.id));
                const sentTasks = tempTasks.filter(t => t.task.status === Entities.TaskStatus.Sent).sort((a, b) => a.task.id.localeCompare(b.task.id));
                const pendingTasks = tempTasks.filter(t => t.task.status === Entities.TaskStatus.Pending).sort((a, b) => a.task.id.localeCompare(b.task.id));


                if (sentTasks.length + pendingTasks.length < this.processingCount) {
                    if (queuedTasks.length > 0) {
                        taskDetail = queuedTasks[0];
                    }
                }

                if (taskDetail) {
                    this.logger.info(`Queued: ${queuedTasks.length}, Sent: ${sentTasks.length}, Pending: ${pendingTasks.length}`);
                    this.logger.info(`Executing task ${taskDetail.task.id} - Status: ${taskDetail.task.status}`);
                    try {
                        await this.processTask(taskDetail.task);
                    }
                    catch (error) {
                        this.logger.error(`Error executing task ${taskDetail.task.id}: ${(error as Error).message}`);
                        await this.updateTaskStatus(taskDetail.task.id, Entities.TaskStatus.Rejected);
                        await this.filterTasks();
                        await this.tryFinalizeBatch(taskDetail.task.batch.name);
                    }
                }

            } catch (error) {
            }
            finally {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async processTask(task: Entities.Task): Promise<void> {
        const content = await this.batchSourceRepository.getContent(this.batchInRoot, task.batch.name, task.name);
        if (!content) {
            throw new Error(`Content not found for task ${task.id}`);
        }
        const taskCallbackData: Entities.TaskCallbackData = {
            id: task.id,
            batch: task.batch.name,
        };

        task.sessionId = await this.indexService.index(this.context, content.documentType, Readable.from([Buffer.from(content.data)]), this.choice.items, this.indexCallback, taskCallbackData);
        await this.updateTaskStatus(task.id, Entities.TaskStatus.Sent);

        await this.batchClient.createSession(task.sessionId, task.batch.name);
        await this.batchRepository.setTaskSession(this.batchType, task.batch.name, task.id, task.sessionId);
        await this.updateTaskStatus(task.id, Entities.TaskStatus.Pending);
    }
} 
