import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for reprocess callback use case.
 * Contains session identifier and callback data. 
 * This interface is used to pass data to the use case for processing the reprocess callback.
 * @interface ReprocessCallbackData
 * @property {Entities.SessionCallbackData} sessionData - The session data associated with the reprocess process, containing necessary information for processing.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback, containing necessary information for processing.
 */
export interface ReprocessCallbackData {
  sessionData: Entities.SessionCallbackData,
  callbackData: Entities.CallbackData
}

/** Use case for handling reprocess callback.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class ReprocessCallbackUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.REPROCESS,
    step: Entities.Step.REPROCESS
  };

  constructor(
    @Inject(TOKENS.IIntegrationService) private readonly integrationService: Interfaces.IIntegrationService,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
    @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
  ) { }


  /**
   * Executes the use case for processing the reprocess callback.
   * 
   * @param data - The data containing session identifier and callback data
   */
  async execute(data: ReprocessCallbackData): Promise<void> {
    if (data.callbackData.status != Entities.CallbackStatus.COMPLETED) {
      if (data.callbackData.status == Entities.CallbackStatus.ERROR) {
        {
          const metaDataContext: Entities.MetaDataContext = { error: `Reprocess callback status is not completed: ${data.callbackData.data}` };
          await this.trackingService.trackError(this.context, data.sessionData.id, `Reprocess callback status is not completed: ${data.callbackData.data}`);
          await this.integrationService.processRefine(data.sessionData, metaDataContext);
        }
        return;
      }
      return;
    }

    let metaData: string;
    try {
      metaData = await this.blobService.downloadString(data.callbackData.data);
    }
    catch (error) {
      const metaDataContext: Entities.MetaDataContext = { error: (error as Error).message };
      await this.trackingService.trackError(this.context, data.sessionData.id, `Error reading metadata from blob: ${data.callbackData.data}`);
      await this.integrationService.processRefine(data.sessionData, metaDataContext);
      return;
    }

    // The processing should be done in the integration service
    const metaDataContext: Entities.MetaDataContext = { metaData: metaData }; 
    try {
      await this.integrationService.processRefine(data.sessionData, metaDataContext);
    }
    catch (error) {
      const metaDataContext: Entities.MetaDataContext = { error: (error as Error).message };
      await this.trackingService.trackError(this.context, data.sessionData.id, `Error processing reprocess: ${(error as Error).message}`);
      await this.integrationService.processRefine(data.sessionData, metaDataContext);
      return;
    }
    await this.trackingService.trackSuccess(this.context, data.sessionData.id);

  }
}