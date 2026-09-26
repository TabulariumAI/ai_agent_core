import * as Entities from "../entities/imports";
/**
 * Interface for batch repository.
 * Defines the methods for managing batches and tasks within the repository.
 */
export interface IBatchRepository {
    /**
     * Creates a new batch in the repository.
     * @param batch - The batch entity to be created.
     */
    createBatch(batch: Entities.Batch): Promise<void>;

    /**
     * Sets the status of a batch in the repository.
     * @param batch - The batch detail entity.
     * @param status - The new status of the batch.
     */
    setBatchStatus(batch: Entities.BatchDetail, status: Entities.BatchStatus): Promise<void>;

    /**
     * Retrieves the status of a batch from the repository.
     * @param batch - The batch detail entity.
     * @returns The current status of the batch.
     */
    getBatchStatus(batch: Entities.BatchDetail): Promise<Entities.BatchStatus>;

    /**
     * Retrieves the report of a batch from the repository.
     * @param batch - The batch detail entity.
     * @returns The batch report entity.
     */
    getBatchReport(batch: Entities.BatchDetail): Promise<Entities.BatchReport>;

    /**
     * Retrieves a task from the repository by its ID.
     * @param taskId - The ID of the task to retrieve.
     * @returns The task entity, or null if not found.
     */
    getTask(batchType: Entities.BatchType, batchId: string, taskId: string): Promise<Entities.Task | null>;

    /**
     * Finalizes the current batch in the repository.
     */
    finalizeBatch(): Promise<void>;
    /**
     * Sets the status of a task in the repository.
     * @param task - The task entity.
     * @param status - The new status of the task.
     */
    setTaskStatus(task: Entities.Task, status: Entities.TaskStatus): Promise<void>;
    /**
     * Sets the session ID for a specific task within a batch.
     * @param batchType - The type of the batch.
     * @param batchId - The ID of the batch.
     * @param taskId - The ID of the task.
     * @param sessionId - The session ID to be associated with the task.
     */
    setTaskSession(batchType: Entities.BatchType, batchId: string, taskId: string,  sessionId: string): Promise<void>;
    /**
     * Retrieves the session ID for a specific task within a batch.
     * @param batchType - The type of the batch.
     * @param batchId - The ID of the batch.
     * @param taskId - The ID of the task.
     * @returns The session ID associated with the task, or null if not found.
     */
    getTaskSession(batchType: Entities.BatchType, batchId: string, taskId: string): Promise<string | null>;
}