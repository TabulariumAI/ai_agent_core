import { Inject, Service } from "typedi";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for redact use case.
 * Contains session identifier and metadata.
 * This interface is used to pass data to the use case for processing the redact operation.
 * @interface RedactData
 * @property {Entities.SessionCallbackData} sessionData - The session callback data for the redact process.
 * @property {string | null} metaData - The metadata associated with the document, can be null if not available.
 */
export interface RedactData {
  sessionData: Entities.SessionCallbackData,
  metaData: string | null,
}

/** Use case for handling redact operations.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class RedactUseCase {
  constructor(
    @Inject(TOKENS.IRedactClient) private readonly redactClient: Interfaces.IRedactClient
  ) { }

  /**
   * Executes the use case for processing the redact operation.
   * 
   * @param data - The data containing session identifier and metadata
   */
  async execute(data: RedactData): Promise<void> {
    const context: Entities.WorkflowContext = {
      workflow: Entities.Workflow.REDACT,
      step: Entities.Step.REDACT
    };

    await this.redactClient.redactDocument(context, data.sessionData, data.metaData, Entities.Callback.REDACT);
  }
}