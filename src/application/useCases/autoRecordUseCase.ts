import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";
import { UseCaseHelper } from "../utils/useCaseHelper";
import { autoRecordChoice } from "./choices/autoRecordChoice";

/** * Data structure for auto-record use case.
 * Contains document type and stream.
 * @interface AutoRecordData
 * @property {string} documentType - The type of the document to be processed.
 * @property {Readable} stream - The stream containing the document data.
 * * This interface is used to pass data to the use case for processing auto-records.
 */
export interface AutoRecordData {
    documentType: string,
    stream: Readable,
}

/**
 * Use case for handling auto-records.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class AutoRecordUseCase {
    private readonly context = {
        workflow: Entities.Workflow.AUTORECORD,
        step: Entities.Step.INDEX
    }

    constructor(
        @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
        @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
        @Inject() private readonly helper: UseCaseHelper,
    ) { }

    /**
     * Executes the use case for processing the auto-record.
     * 
     * @param data - The data containing document type and stream
     * @returns {Promise<string>} - The session identifier for the processed document
     */
    async execute(data: AutoRecordData): Promise<string> {
        const session = await this.helper.index(this.context, data.documentType, data.stream, autoRecordChoice.items, Entities.Callback.AUTORECORD_INDEX);
        return session;
    }
}