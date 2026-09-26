import { Inject, Service } from "typedi";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for calc use case.
 * Contains session identifier and metadata.
 * This interface is used to pass data to the use case for processing the calc operation.
 * @interface CalcData
 * @property {Entities.SessionCallbackData} sessionData - The session callback data associated with the calc process.
 * @property {Entities.MetaData | null} metaData - The metadata associated with the calc operation, can be null if not available.
 */
export interface CalcData {
    sessionData: Entities.SessionCallbackData,
    metaData: string | null,
}

/** Use case for handling calc operations.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class CalcUseCase {

    constructor(
        @Inject(TOKENS.IComputeClient) private readonly computeClient: Interfaces.IComputeClient
    ) { }

    /**
     * Executes the use case for processing the calc operation.
     * 
     * @param data - The data containing session identifier and metadata
     */
    async execute(data: CalcData): Promise<void> {
        const context: Entities.WorkflowContext = {
            workflow: Entities.Workflow.CALC,
            step: Entities.Step.CALC
        };

        await this.computeClient.calcDocument(context, data.sessionData, data.metaData, Entities.Callback.CALC);
    }

}