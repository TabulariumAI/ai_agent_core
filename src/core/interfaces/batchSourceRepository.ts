import { Readable } from "stream";
import * as Entities from "../entities/imports";

/**
 * Interface for batch source repository.
 * Defines the methods for managing batch sources and their content.
 */
export interface IBatchSourceRepository {
    getBatch(rootPath: string, batchName: string): Promise<Entities.BatchSource | null>;
    getContent(rootPath: string, batchName: string, itemName: string): Promise<Entities.Content | null>;
    setContent(rootPath: string, batchName: string, itemName: string, content: Entities.Content): Promise<void>;
    setReport(rootPath: string, batchName: string, report: Entities.BatchReport): Promise<void>;
}