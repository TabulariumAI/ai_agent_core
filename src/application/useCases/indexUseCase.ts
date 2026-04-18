import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";
import { UseCaseHelper } from "../utils/useCaseHelper";
import { indexChoice } from "./choices/indexChoice";

/** Data structure for index use case.
 * Contains document type and stream.
 * This interface is used to pass data to the use case for processing the index operation.
 * @interface IndexData
 * @property {string} documentType - The type of the document being indexed.
 * @property {Readable} stream - The stream of the document content.
 */
export interface IndexData {
    documentType: string,
    stream: Readable,
}

/** Use case for handling index operations.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class IndexUseCase {
    private readonly context: Entities.WorkflowContext = {
        workflow: Entities.Workflow.INDEX,
        step: Entities.Step.INDEX
    };

    constructor(
        @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
        @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
        @Inject() private readonly helper: UseCaseHelper,
    ) { }

    /**
     * Executes the use case for processing the index operation.
     * 
     * @param data - The data containing document type and stream
     * @returns {Promise<string>} - Returns the session identifier for the indexed document
     */
    async execute(data: IndexData): Promise<string> {
        const session = await this.helper.index(this.context, data.documentType, data.stream, indexChoice.items, Entities.Callback.INDEX);
        return session;
    }
}