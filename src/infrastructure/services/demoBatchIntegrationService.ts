import { Inject, Service } from "typedi";
import * as fs from "fs";
import * as path from "path";

import * as Entities from "../../core/entities/imports";
import * as Interfaces from "../../core/interfaces/imports";
import { FileTypeService } from "./fileTypeService";
import { CallbackService } from "./callbackService";
import { TOKENS } from "../../core/tokens";
import { Config } from "../../config";
import { getIndexProcessor, getRedactProcessor } from "../../application/processors/processorRegistry";


/**
 * Persists ordinary workflow results under mock-data and batch results in Azure.
 * Batch index/redaction results also finalize their in-memory processor tasks.
 * Record number assignment is demo behavior, using a random number and current date.
 */
@Service()
export class DemoBatchIntegrationService implements Interfaces.IIntegrationService {

    constructor(
        @Inject(TOKENS.ILogger) private readonly logger: Interfaces.ILogger,
        @Inject(TOKENS.IBatchSourceRepository) private readonly batchSourceRepository: Interfaces.IBatchSourceRepository,
        @Inject(TOKENS.IBatchRepository) private readonly batchRepository: Interfaces.IBatchRepository,
        @Inject() private readonly fileTypeService: FileTypeService,
        @Inject() private readonly callbackService: CallbackService,
    ) {
    }

    /** Saves JSON data to a file in the specified session and directory.
     * @param session - The session identifier.
     * @param dir - The directory where the file will be saved.
     * @param file - The name of the file to save.
     * @param data - The JSON data to save.
     * @return A promise that resolves to the full path of the saved file.
     * @throws Error if there is an issue creating directories or writing the file.
     */
    private async saveMetadataJson(session: string, dir: string, file: string, data: any): Promise<string> {
        const outputDir = path.resolve(__dirname, `../../../mock-data/${session}/${dir}`);
        try {
            const fullPath = path.join(outputDir, file);
            await fs.promises.mkdir(outputDir, { recursive: true });
            await fs.promises.writeFile(fullPath, typeof data === "string" ? data : JSON.stringify(data, null, 2));
            return fullPath;
        } catch (error) {
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
    private async saveDocument(session: string, dir: string, file: string, content: Entities.Content): Promise<string> {
        const outputDir = path.resolve(__dirname, `../../../mock-data/${session}/${dir}`);
        const extension = this.callbackService.getCallbackDataFileExtension(content.documentType)
            || this.fileTypeService.getFileType(content.documentType);
        const fileName = `document.${extension}`;
        const fullPath = path.join(outputDir, fileName);
        try {
            await fs.promises.mkdir(outputDir, { recursive: true });
        } catch (error) {
            //this.logger.error("Error creating directory:", error);
            throw new Error(`Failed to create directory: ${outputDir}`);
        }
        try {
            await fs.promises.writeFile(fullPath, content.data);
            return fullPath;
        } catch (error) {
            //this.logger.error("Error saving document:", error);
            throw new Error(`Failed to save document: ${fullPath}`);
        }
    }

    /** Processes the index step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param context - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processIndex(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void> {
        if (!session.task) {
            if (context.metaData) {
                const fullPath = await this.saveMetadataJson(session.id, "index", "metadata.json", context.metaData);
                this.logger.info(`Index metadata saved to ${fullPath}`);
            } else {
                this.logger.error(`Index failed for session ${session.id}: ${context.error || "No metadata to save"}`);
            }
            return;
        }
        if (!session.task || !session.task.id) {
            throw new Error(`Invalid session data: ${JSON.stringify(session)}`);
        }
        if (context.metaData) {
            const task = await this.batchRepository.getTask(Entities.BatchType.Index, session.task.batch, session.task.id);
            if (!task) {
                throw new Error(`Task not found: ${session.task.id}`);
            }

            await this.batchSourceRepository.setContent(Config.batchIndexOut, session.task.batch, task.name, {
                documentType: "json",
                data: Buffer.from(context.metaData)
            });
            await getIndexProcessor().finalizeTaskSuccess(session.task.id);
            this.logger.info(`Info: workflow:${Entities.Workflow.INDEX}, session: ${session.id}. Metadata saved to ${Config.batchIndexOut}`);
        }
        else {
            await getIndexProcessor().finalizeTaskFailure(session.task.id, `No metadata to save`);
            this.logger.error(`Warning: workflow:${Entities.Workflow.INDEX}, session: ${session.id}. No metadata to save.`);
        }
    }

    /** Processes the refine step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param context - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processRefine(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void> {
        if (context.metaData) {
            const fullPath = await this.saveMetadataJson(session.id, "refine", "metadata.json", context.metaData);
            this.logger.info(`Info: workflow:${Entities.Workflow.REPROCESS}, session: ${session.id}. Metadata saved to ${fullPath}`);
        }
        else {
            this.logger.error(`Warning: workflow:${Entities.Workflow.REPROCESS}, session: ${session.id}. No metadata to save.`);
        }
    }

    /** Processes the calc step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param context - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processCalc(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void> {
        if (context.metaData) {
            const fullPath = await this.saveMetadataJson(session.id, "calc", "metadata.json", context.metaData);
            this.logger.info(`Info: workflow:${Entities.Workflow.CALC}, session: ${session.id}. Metadata saved to ${fullPath}`);
        }
        else {
            this.logger.error(`Warning: workflow:${Entities.Workflow.CALC}, session: ${session.id}. No metadata to save.`);
        }
    }

    /** Processes the provision step by saving metadata to a JSON file.
     * @param session - The session identifier.
     * @param context - The metadata to save.
     * @return A promise that resolves when the metadata is saved.
     * @throws Error if there is an issue saving the metadata.
     */
    async processProvision(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void> {
        if (context.metaData) {
            const fullPath = await this.saveMetadataJson(session.id, "provision", "metadata.json", context.metaData);
            this.logger.info(`Info: workflow:${Entities.Workflow.PROVISION}, session: ${session.id}. Metadata saved to ${fullPath}`);
        }
        else {
            this.logger.error(`Warning: workflow:${Entities.Workflow.PROVISION}, session: ${session.id}. No metadata to save.`);
        }
    }

    /** Processes the redact step by saving a document.
     * @param session - The session identifier.
     * @param context - The content containing the document data.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processRedact(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void> {
        if (context.content) {
            const fullPath = await this.saveDocument(session.id, "redact", this.callbackService.getCallbackDataFile(context.content.documentType), context.content);
            this.logger.info(`Info: workflow:${Entities.Workflow.REDACT}, session: ${session.id}. Document saved to ${fullPath}`);
        }
        else {
            this.logger.error(`Warning: workflow:${Entities.Workflow.REDACT}, session: ${session.id}. No document to save.`);
        }
    }

    /** Processes the auto-redact step by saving a document.
     * @param session - The session identifier.
     * @param context - The content containing the document data.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processAutoRedact(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void> {
        if (!session.task) {
            if (context.content) {
                const file = this.callbackService.getCallbackDataFile(context.content.documentType);
                const fullPath = await this.saveDocument(session.id, "autoredact", file, context.content);
                this.logger.info(`Auto-redacted document saved to ${fullPath}`);
            } else {
                this.logger.error(`Auto-redaction failed for session ${session.id}: ${context.error || "No document to save"}`);
            }
            return;
        }
        if (!session.task || !session.task.id) {
            throw new Error(`Invalid session data: ${JSON.stringify(session)}`);
        }
        if (context.content) {
            const task = await this.batchRepository.getTask(Entities.BatchType.Redact, session.task.batch, session.task.id);
            if (!task) {
                throw new Error(`Task not found: ${session.task.id}`);
            }

            await this.batchSourceRepository.setContent(Config.batchRedactOut, session.task.batch, task.name, {
                documentType: this.callbackService.getCallbackDataFileExtension(context.content.documentType),
                data: context.content.data
            });
            await getRedactProcessor().finalizeTaskSuccess(session.task.id);
            this.logger.info(`Info: workflow:${Entities.Workflow.AUTOREDACT}, session: ${session.id}. Document saved to ${Config.batchRedactOut}`);
        }
        else {
            await getRedactProcessor().finalizeTaskFailure(session.task.id, `No document to save`);
            this.logger.error(`Warning: workflow:${Entities.Workflow.AUTOREDACT}, session: ${session.id}. No document to save.`);
        }
    }

    /** Processes the endorse step by saving a document.
     * @param session - The session identifier.
     * @param context - The content containing the document data.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processEndorse(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void> {
        if (context.content) {
            const fullPath = await this.saveDocument(session.id, "endorse", this.callbackService.getCallbackDataFile(context.content.documentType), context.content);
            this.logger.info(`Info: workflow:${Entities.Workflow.ENDORSE}, session: ${session.id}. Document saved to ${fullPath}`);
        }
        else {
            this.logger.error(`Warning: workflow:${Entities.Workflow.ENDORSE}, session: ${session.id}. No document to save.`);
        }
    }

    /** Processes the auto-record step by saving a document.
     * @param session - The session identifier.
     * @param context - The content containing the document data.
     * @return A promise that resolves when the document is saved.
     * @throws Error if there is an issue saving the document.
     */
    async processAutoRecord(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void> {

        if (context.content) {
            const fullPath = await this.saveDocument(session.id, "autorecord", this.callbackService.getCallbackDataFile(context.content.documentType), context.content);
            this.logger.info(`Info: workflow:${Entities.Workflow.AUTORECORD}, session: ${session.id}. Document saved to ${fullPath}`);
        }
        else {
            this.logger.error(`Warning: workflow:${Entities.Workflow.AUTORECORD}, session: ${session.id}. No document to save.`);
        }
    }

    /** Records metadata for a document.
     * @param session - The session identifier.
     * @param data - The metadata to record.
     * @return A promise that resolves to the recorded metadata.
     * @throws Error if there is an issue recording the metadata.
     */
    async record(session: string, metaData: string): Promise<string> {
        // Parse the string data into a JSON object
        const data = JSON.parse(metaData);

        //this.logger.info(`Record: session: ${session}`);
        data.heading.number = (Math.floor(Math.random() * 900) + 100).toString();
        data.heading.date = new Date().toISOString();

        return JSON.stringify(data);
    }



}
