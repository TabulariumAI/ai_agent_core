import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";
import { UseCaseHelper } from "../utils/useCaseHelper";
import { autoRedactChoice } from "./choices/autoRedactChoice";

/** * Data structure for auto-redact use case.
 * Contains document type and stream.
 * @interface AutoRedactData
 * @property {string} documentType - The type of the document to be processed.
 * @property {Readable} stream - The stream containing the document data.
 * This interface is used to pass data to the use case for processing auto-redacts.
 */
export interface AutoRedactData {
    documentType: string,
    stream: Readable,
}

/**
 * Use case for handling auto-redacts.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class AutoRedactUseCase {
    private readonly context = {
        workflow: Entities.Workflow.AUTOREDACT,
        step: Entities.Step.INDEX
    }

    constructor(
        @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
        @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
        @Inject() private readonly helper: UseCaseHelper,
    ) { }

    /**
     * Executes the use case for processing the auto-redact.
     * 
     * @param data - The data containing document type, stream, and choice items
     * @returns {Promise<string>} - The session identifier for the processed document
     */
    async execute(data: AutoRedactData): Promise<string> {
        const session = await this.helper.index(this.context, data.documentType, data.stream, autoRedactChoice.items, Entities.Callback.AUTOREDACT_INDEX);
        return session;
    }
}