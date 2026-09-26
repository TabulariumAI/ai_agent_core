import * as Entities from "../entities/imports";
/**
 * Interface for task executor.
 * Defines the contract for executing tasks and returning their results.
 */
export interface ITaskExecutor {
    /**
     * Executes the given task and returns the result.
     * @param task - The task to be executed.
     * @returns A promise that resolves to the result of the task execution.
     */
    execute(task: Entities.Task): Promise<Entities.TaskResult>;
}