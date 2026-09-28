import { Service } from "typedi";
import * as fs from 'fs';
import * as path from 'path';
import { Config } from "../../config";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";


interface Version {
    status: string;
    version: number;
}

@Service()
export class FsBatchRepository implements Interfaces.IBatchRepository {
    private readonly batches: string = "batches";
    private readonly tasks: string = "tasks";
    private readonly sessions: string = "sessions";

    async createBatch(batch: Entities.Batch): Promise<void> {
        const batchDir = path.join(Config.processingDir, this.batches, batch.detail.type.toString(), batch.detail.name);
        if (await fs.promises.access(batchDir).then(() => true).catch(() => false)) {
            throw new Entities.BadRequestError(`Batch already exists: ${batchDir}`);
        }

        await fs.promises.mkdir(batchDir, { recursive: true });
        const tasksDir = path.join(batchDir, this.tasks);
        await fs.promises.mkdir(tasksDir, { recursive: true });

        // write all task details to the pending directory
        const taskPromises = batch.items.map(async (item) => {

            const taskDir = path.join(tasksDir, `${path.basename(item.id)}`);
            await fs.promises.mkdir(taskDir, { recursive: true });
            return await fs.promises.writeFile(path.join(taskDir, `data.${item.status}.v#1.json`), JSON.stringify(item), { flag: "wx" });
        });
        await Promise.all(taskPromises);

    }

    async setBatchStatus(batch: Entities.BatchDetail, status: Entities.BatchStatus): Promise<void> {
        const batchDir = path.join(Config.processingDir, this.batches, batch.type.toString(), batch.name);
        const lastVersion = await this.getLastVersion(batchDir);
        let nextVersion = 1;
        if (lastVersion) {
            nextVersion = lastVersion.version + 1;
        }

        const batchPath = path.join(batchDir, `data.${status.toString()}.v#${nextVersion}.json`);
        await fs.promises.writeFile(batchPath, JSON.stringify(batch), { flag: "wx" });
    }

    async getBatchStatus(batch: Entities.BatchDetail): Promise<Entities.BatchStatus> {
        const batchDir = path.join(Config.processingDir, this.batches, batch.type.toString(), batch.name);
        const lastVersion = await this.getLastVersion(batchDir);
        if (!lastVersion) {
            return Entities.BatchStatus.None;
        }
        return lastVersion.status as Entities.BatchStatus;
    }

    async getBatchReport(batch: Entities.BatchDetail): Promise<Entities.BatchReport> {
        let items: Entities.BatchReportItem[] = [];
        const tasksDir = path.join(Config.processingDir, this.batches, batch.type.toString(), batch.name, this.tasks);
        for (const taskId of await fs.promises.readdir(tasksDir)) {
            const taskDir = path.join(tasksDir, taskId);
            const lastVersion = await this.getLastVersion(taskDir);
            if (!lastVersion) {
                continue;
            }
            const existingItem = items.find(item => item.status === lastVersion.status);
            if (existingItem) {
                existingItem.count += 1;
            } else {
                items.push({ status: lastVersion.status, count: 1 });
            }
        }
        
        // Convert the report array into the expected BatchReport format
        const batchReport: Entities.BatchReport = {
            batch,
            items: items
        };
        return batchReport;
    }


    async finalizeBatch(): Promise<void> {
        //const processedFlagPath = path.join(Config.processingDir, this.batches, this.processedFlag);
        //await fs.promises.writeFile(processedFlagPath, "", { flag: "wx" });
    }

    /**
     * Retrieves a task from the repository by its ID.
     * @param batchType - The type of the batch.
     * @param batchId - The ID of the batch.
     * @param taskId - The ID of the task to retrieve.
     * @returns The task entity, or null if not found.
     */
    async getTask(batchType: Entities.BatchType, batchId: string, taskId: string): Promise<Entities.Task | null> {
        const taskDir = path.join(Config.processingDir, this.batches, batchType.toString(), batchId, this.tasks, taskId);
        const lastVersion = await this.getLastVersion(taskDir);
        if (!lastVersion) {
            return null;
        }
        const taskFile = path.join(taskDir, `data.${lastVersion.status}.v#${lastVersion.version}.json`);
        const taskData = await fs.promises.readFile(taskFile, "utf-8");
        return JSON.parse(taskData);
    }


    async setTaskStatus(task: Entities.Task, status: Entities.TaskStatus): Promise<void> {
        const taskDir = path.join(Config.processingDir, this.batches, task.batch.type.toString(), task.batch.name, this.tasks, task.id);
        const lastVersion = await this.getLastVersion(taskDir);
        let nextVersion = 1;
        if (lastVersion) {
            nextVersion = lastVersion.version + 1;
        }
        else {
            throw new Error(`Failed to determine the last version for task ${task.id}`);
        }

        const taskPath = path.join(taskDir, `data.${status.toString()}.v#${nextVersion}.json`);
        await fs.promises.writeFile(taskPath, JSON.stringify(task), { flag: "wx" });
    }


    async setTaskSession(batchType: Entities.BatchType, batchId: string, taskId: string, sessionId: string): Promise<void> {
        const taskDir = path.join(Config.processingDir, this.batches, batchType.toString(), batchId, this.tasks, taskId);
        const sessionFile = path.join(taskDir, `session.${sessionId}.json`);

        await fs.promises.writeFile(sessionFile, "{}", { flag: "w" });
    }

    async getTaskSession(batchType: Entities.BatchType, batchId: string, taskId: string): Promise<string | null> {
        const regex = /^session\.(.+?)\.json$/;

        const taskDir = path.join(Config.processingDir, this.batches, batchType.toString(), batchId, this.tasks, taskId);
        const files = await fs.promises.readdir(taskDir);
        const validMatches: string[] = files
            .map(file => {
                const match = file.match(regex);
                if (!match) return null;

                return match[0];
            })
            .filter((item): item is string => item !== null);

        if (validMatches.length === 0) {
            return null;
        }
        return validMatches[0];
    }


    private async getLastVersion(dir: string): Promise<Version | null> {
        let files: string[];
        try {
            files = fs.readdirSync(dir);
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return null;
            }
            throw error;
        }

        // Match pattern: data.{status}.#{version}.json
        // Captures any alphanumeric status ([^.]+) and the digits after '#' (\\d+)
        const regex = /^data\.(\w+)\.v#(\d+)\.json$/;

        const validMatches: Version[] = files
            .map(file => {
                const match = file.match(regex);
                if (!match) return null;

                return {
                    status: match[1],               // First capture group: status
                    version: parseInt(match[2], 10) // Second capture group: version
                };
            })
            .filter((item): item is Version => item !== null);

        if (validMatches.length === 0) {
            return null; // No matching files found
        }

        // Reduce the array to find the object with the highest version number
        return validMatches.reduce((max, current) =>
            current.version > max.version ? current : max
        );
    }


}