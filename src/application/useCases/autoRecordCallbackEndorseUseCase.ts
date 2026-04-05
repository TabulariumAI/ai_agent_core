import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** * Data structure for auto-record endorsement callback use case.
 * Contains session identifier and callback data.
 * @interface AutoRecordCallbackEndorseData
 * @property {string} session - The session identifier for the callback.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback.
 * * This interface is used to pass data to the use case for processing auto-record endorsement callbacks.
 */
export interface AutoRecordCallbackEndorseData {
  session: string,
  callbackData: Entities.CallbackData
}

/**
 * Use case for handling auto-record endorsement callbacks.
 * It processes the callback data and triggers the next step in the workflow.
 */
@Service()
export class AutoRecordCallbackEndorseUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.AUTORECORD,
    step: Entities.Step.ENDORSE
  };

  constructor(
    @Inject(TOKENS.IIntegrationService) private readonly integrationService: Interfaces.IIntegrationService,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
    @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
  ) { }

  /**
   * Executes the use case for processing the auto-record endorsement callback.
   * 
   * @param data - The data containing session and callback information
   */
  async execute(data: AutoRecordCallbackEndorseData): Promise<void> {

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

    await this.trackingService.trackSuccess(this.context, data.session);

    // The processing should be done in the integration service 
    try {
      await this.integrationService.processAutoRecord(data.session, stream, data.callbackData.types);
    }
    catch (error) {
      await this.trackingService.trackError(this.context, data.session, `Error processing auto-record: ${error instanceof Error ? error.message : String(error)}`);
      return;
    }

  }
}