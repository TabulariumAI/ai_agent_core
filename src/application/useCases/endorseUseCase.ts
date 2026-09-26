import { Inject, Service } from "typedi";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for endorse use case.
 * Contains session identifier and metadata.
 * This interface is used to pass data to the use case for processing the endorse operation.
 * @interface EndorseData
 * @property {Entities.SessionCallbackData} sessionData - The session callback data associated with the endorse process.
 * @property {string | null} metaData - The metadata associated with the endorse operation.
 */
export interface EndorseData {
  sessionData: Entities.SessionCallbackData,
  metaData: string,
}

/** Use case for handling endorse operations.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class EndorseUseCase {

  constructor(
    @Inject(TOKENS.IRecordClient) private readonly recordClient: Interfaces.IRecordClient
  ) { }

  /**
   * Executes the use case for processing the endorse operation.
   * 
   * @param data - The data containing session identifier and metadata
   */
  async execute(data: EndorseData): Promise<void> {
    const context: Entities.WorkflowContext = {
      workflow: Entities.Workflow.ENDORSE,
      step: Entities.Step.ENDORSE
    };

    await this.recordClient.endorseDocument(context, data.sessionData, data.metaData, Entities.Callback.ENDORSE);
  }
}