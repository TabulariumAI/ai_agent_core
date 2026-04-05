import { Service } from "typedi";
import { Readable, pipeline } from "stream";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

const pipelineAsync = promisify(pipeline);

import { IIntegrationService } from "../../core/interfaces/integrationService";
import { MetaData } from "../../core/entities/metadata";
import * as fs from "fs";
import * as path from "path";
import { Workflow } from "../../core/entities/workflowContext";
import { CallbackType } from "../../core/entities/imports";


/**
 * IIntegrationService implementation for demo purposes.
 * This service logs the method calls and their parameters to the console.
 * It simulates the behavior of an integration service without performing any actual operations.
 */
@Service()
export class DemoIntegrationService implements IIntegrationService {

    /** Saves JSON data to a file in the specified session and directory.
     * @param session - The session identifier.
     * @param dir - The directory where the file will be saved.
     * @param file - The name of the file to save.
     * @param data - The JSON data to save.
     * @return A promise that resolves to the full path of the saved file.
     * @throws Error if there is an issue creating directories or writing the file.
     */
    private async saveJson(session: string, dir: string, file: string, data: any): Promise<string> {
        const outputDir = path.resolve(__dirname, `../../../mock-data/${session}/${dir}`);
        try {
            const fullPath = path.join(outputDir, file);
            await fs.promises.mkdir(outputDir, { recursive: true });
            await fs.promises.writeFile(fullPath, JSON.stringify(data, null, 2));
            return fullPath;
        } catch (error) {
            console.error("Error creating directories:", error);
            throw new Error("Failed to save Json file");
        }
    }

    /** Saves a document to the specified session and directory.
     * @param session - The session identifier.
     * @param dir - The directory where the file will be saved.
     * @param file - The name of the file to save.
     * @param data - The Readable stream containing the document data.
     * @return A promise that resolves to the full path of the saved file.
     * @throws Error if there is an issue creating directories or writing the file.
     */
    private async saveDocument(session: string, dir: string, file: string, data: Readable): Promise<string> {
        const outputDir = path.resolve(__dirname, `../../../mock-data/${session}/${dir}`);
        const fullPath = path.join(outputDir, file);
        try {
            await fs.promises.mkdir(outputDir, { recursive: true });
        } catch (error) {
            console.error("Error creating directory:", error);
            throw new Error(`Failed to create directory: ${outputDir}`);
        }
        try {
            const writeStream = fs.createWriteStream(fullPath);
            await pipelineAsync(data, writeStream);
            return fullPath;
        } catch (error) {
            console.error("Error saving document:", error);
            throw new Error(`Failed to save document: ${fullPath}`);
        }
    }

    /** Processes the index step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param data - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processIndex(session: string, data: MetaData): Promise<void> {
        const fullPath = await this.saveJson(session, "index", "metadata.json", data);
        console.log(`Info: workflow:${Workflow.INDEX}, session: ${session}. Metadata saved to ${fullPath}`);
    }

    /** Processes the refine step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param data - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processRefine(session: string, data: MetaData): Promise<void> {
        const fullPath = await this.saveJson(session, "refine", "metadata.json", data);
        console.log(`Info: workflow:${Workflow.REPROCESS}, session: ${session}. Metadata saved to ${fullPath}`);
    }

    /** Processes the calc step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param data - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processCalc(session: string, data: MetaData): Promise<void> {
        const fullPath = await this.saveJson(session, "calc", "metadata.json", data);
        console.log(`Info: workflow:${Workflow.CALC}, session: ${session}. Metadata saved to ${fullPath}`);
    }

    /** Processes the provision step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param data - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processProvision(session: string, data: MetaData): Promise<void> {
        const fullPath = await this.saveJson(session, "provision", "metadata.json", data);
        console.log(`Info: workflow:${Workflow.PROVISION}, session: ${session}. Metadata saved to ${fullPath}`);
    }

    /** Processes the redact step by saving a document.
     * @param session - The session identifier.
     * @param data - The Readable stream containing the document data.
     * @param type - The type of callback to be processed.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processRedact(session: string, data: Readable, type: string): Promise<void> {
        const fullPath = await this.saveDocument(session, "redact", "document."+ type.toLowerCase().replace(/"/g, "").replace("redact", ""), data);
        console.log(`Info: workflow:${Workflow.REDACT}, session: ${session}. Document saved to ${fullPath}`);
    }

    /** Processes the auto-redact step by saving a document.
     * @param session - The session identifier.
     * @param data - The Readable stream containing the document data.
     * @param type - The type of callback to be processed.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processAutoRedact(session: string, data: Readable, type: string): Promise<void> {
        const fullPath = await this.saveDocument(session, "autoredact", "document."+ type.toLowerCase().replace(/"/g, "").replace("redact", ""), data);
        console.log(`Info: workflow:${Workflow.AUTOREDACT}, session: ${session}. Document saved to ${fullPath}`);
    }

    /** Processes the endorse step by saving a document.
     * @param session - The session identifier.
     * @param data - The Readable stream containing the document data.
     * @param type - The type of callback to be processed.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processEndorse(session: string, data: Readable, type: string): Promise<void> {
        const fullPath = await this.saveDocument(session, "endorse", "document."+ type.toLowerCase().replace(/"/g, "").replace("record", ""), data);
        console.log(`Info: workflow:${Workflow.ENDORSE}, session: ${session}. Document saved to ${fullPath}`);
    }

    /** Processes the auto-record step by saving a document.
     * @param session - The session identifier.
     * @param data - The Readable stream containing the document data.
     * @param type - The type of callback to be processed.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processAutoRecord(session: string, data: Readable, type: string): Promise<void> {
        const fullPath = await this.saveDocument(session, "autorecord", "document."+ type.toLowerCase().replace(/"/g, "").replace("record", ""), data);
        console.log(`Info: workflow:${Workflow.AUTORECORD}, session: ${session}. Document saved to ${fullPath}`);
    }

    /** Records metadata for a document.
     * @param session - The session identifier.
     * @param data - The metadata to record.
     * @return A promise that resolves to the recorded metadata.
     * @throws Error if there is an issue recording the metadata.
     */
    async record(session: string, data: MetaData): Promise<MetaData> {
        // Title should be mapped to your document internal type
        // Number should be generated in your internal number pool
        // Date should be in an acceptable format

        console.log(`Record: session: ${session}`);
        data.heading.number = (Math.floor(Math.random() * 900) + 100).toString();
        data.heading.title = data.heading.title; // Should be mapped to your document type
        data.heading.date = new Date().toISOString();

        return data;
    }



}