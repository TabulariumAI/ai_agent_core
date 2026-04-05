import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for redact callback use case.
 * Contains session identifier and callback data. 
 * This interface is used to pass data to the use case for processing the redact callback.
 * @interface RedactCallbackData
 * @property {string} session - The session identifier for the redact process.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback, containing necessary information for processing.
 */
export interface RedactCallbackData {
  session: string,
  callbackData: Entities.CallbackData
}

/** Use case for handling redact callback.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class RedactCallbackUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.REDACT,
    step: Entities.Step.REDACT
  };

  constructor(
    @Inject(TOKENS.IIntegrationService) private readonly integrationService: Interfaces.IIntegrationService,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
    @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
  ) { }

  /**
   * Executes the use case for processing the redact callback.
   * 
   * @param data - The data containing session identifier and callback data
   */
  async execute(data: RedactCallbackData): Promise<void> {

    if (data.callbackData.status !== Entities.CallbackStatus.COMPLETED) {
      await this.trackingService.trackError(this.context, data.session, `Callback status is not success: ${data.callbackData.data}`);
      return;
    }

    let stream: Readable;

    try {
      stream = await this.blobService.download(data.callbackData.data);
    }
    catch (error) {
      await this.trackingService.trackError(this.context, data.session, `Error downloading blob: ${data.callbackData.data}`);
      return;
    }

    if (!data.callbackData.types) {
      await this.trackingService.trackError(this.context, data.session, "Callback data type is missing");
      return;
    }

    await this.trackingService.trackSuccess(this.context, data.session,);

    // The processing should be done in the integration service 
    try {
      await this.integrationService.processRedact(data.session, stream, data.callbackData.types);
    }
    catch (error) {
      return;
    }
  }
}