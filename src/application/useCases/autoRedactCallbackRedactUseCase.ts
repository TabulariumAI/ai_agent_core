import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/**
 * Data structure for auto-redact callback redact use case.
 * Contains session identifier and callback data.
 * @interface AutoRedactCallbackRedactData
 * @property {string} session - The session identifier for the callback.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback.
 * This interface is used to pass data to the use case for processing auto-redact callbacks.
 */
export interface AutoRedactCallbackRedactData {
  session: string,
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

    let stream: Readable;

    try {
      stream = await this.blobService.download(data.callbackData.data);
    }
    catch (error) {
      await this.trackingService.trackError(this.context, data.session, `Error downloading blob: ${data.callbackData.data}`);
      return;
    }
    // The processing should be done in the integration service 
    try {
      if (!data.callbackData.types) {
        await this.trackingService.trackError(this.context, data.session, "Callback data type is missing");
        return;
      }
      
      await this.trackingService.trackSuccess(this.context, data.session);

      await this.integrationService.processAutoRedact(data.session, stream, data.callbackData.types);
    }
    catch (error) {
      await this.trackingService.trackError(this.context, data.session, `Error processing auto-redact: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }
  }
}