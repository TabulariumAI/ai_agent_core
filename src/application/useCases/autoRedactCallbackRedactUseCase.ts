import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/**
 * Data structure for auto-redact callback redact use case.
 * Contains session identifier and callback data.
 * @interface AutoRedactCallbackRedactData
 * @property {Entities.SessionCallbackData} sessionData - The session information for the callback.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback.
 * This interface is used to pass data to the use case for processing auto-redact callbacks.
 */
export interface AutoRedactCallbackRedactData {
  sessionData: Entities.SessionCallbackData,
  callbackData: Entities.CallbackData
}

/**
 * Use case for handling auto-redact callbacks.
 * It processes the callback data and triggers the next step in the workflow.
 */
@Service()
export class AutoRedactCallbackRedactUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.AUTOREDACT,
    step: Entities.Step.REDACT
  };

  constructor(
    @Inject(TOKENS.IIntegrationService) private readonly integrationService: Interfaces.IIntegrationService,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
    @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
  ) { }

  /**
   * Executes the use case for processing the auto-redact callback.
   * 
   * @param data - The data containing session and callback information
   */
  async execute(data: AutoRedactCallbackRedactData): Promise<void> {

    if (data.callbackData.status != Entities.CallbackStatus.COMPLETED) {
      if (data.callbackData.status == Entities.CallbackStatus.ERROR) {
        {
          const contentContext: Entities.ContentContext = { error: `Callback status is not completed: ${data.callbackData.data}` };
          await this.trackingService.trackError(this.context, data.sessionData.id, `Callback status is not completed: ${data.callbackData.data}`);
          await this.integrationService.processAutoRedact(data.sessionData, contentContext);

        }
        return;
      }
      return;
    }
    else if (!data.callbackData.types) {
      const contentContext: Entities.ContentContext = { error: "Callback data type is missing" };
      await this.trackingService.trackError(this.context, data.sessionData.id, "Callback data type is missing");
      await this.integrationService.processAutoRedact(data.sessionData, contentContext);
      return;
    }

    let content: Entities.Content;
    try {
      content = await this.blobService.downloadContent(data.callbackData.data, data.callbackData.types);
    }
    catch (error) {
      const contentContext: Entities.ContentContext = { error: (error as Error).message };
      await this.trackingService.trackError(this.context, data.sessionData.id, `Error downloading blob: ${data.callbackData.data}`);
      await this.integrationService.processAutoRedact(data.sessionData, contentContext);
      return;
    }


    // The processing should be done in the integration service 
    try {
      const contentContext: Entities.ContentContext = { content: content };
      await this.integrationService.processAutoRedact(data.sessionData, contentContext);
    }
    catch (error) {
      const contentContext: Entities.ContentContext = { error: (error as Error).message };
      await this.trackingService.trackError(this.context, data.sessionData.id, `Error processing redact: ${(error as Error).message}`);
      await this.integrationService.processAutoRedact(data.sessionData, contentContext);
      return;
    }
    await this.trackingService.trackSuccess(this.context, data.sessionData.id);
  }

}