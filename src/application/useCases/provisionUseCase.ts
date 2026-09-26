import { Inject, Service } from "typedi";
import { Readable } from "stream";

import * as Entities from "../../core/entities/imports";
import { IndexService } from "../../infrastructure/services/indexService";
import { provisionChoice } from "../../core/entities/choices/provisionChoice";

/** Data structure for provision use case.
 * Contains document type and stream.
 * This interface is used to pass data to the use case for processing the provision.
 * @interface ProvisionData
 * @property {string} documentType - The type of document being processed.
 * @property {Readable} stream - The stream of the document to be processed.
 */
export interface ProvisionData {
    documentType: string,
    stream: Readable,
    taskCallbackData?: Entities.TaskCallbackData
}


/** Use case for handling provision.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class ProvisionUseCase {
    private readonly context = {
        workflow: Entities.Workflow.PROVISION,
        step: Entities.Step.INDEX
    }

    constructor(
        @Inject() private readonly indexService: IndexService,
    ) { }

    /**
     * Executes the use case for processing the provision.
     * 
     * @param data - The data containing document type and stream
     * @return {Promise<string>} - The session identifier for the provision process
     */
    async execute(data: ProvisionData): Promise<string> {
        const session = await this.indexService.index(this.context, data.documentType, data.stream, provisionChoice.items, Entities.Callback.PROVISION_INDEX, data.taskCallbackData);
        return session;
    }
}