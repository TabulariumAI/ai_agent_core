import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for calc callback use case.
 * Contains session identifier and callback data. 
 * This interface is used to pass data to the use case for processing the calc callback.
 * @interface CalcCallbackData
 * @property {Entities.SessionCallbackData} sessionData - The session data associated with the callback, containing necessary information for processing.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback, containing necessary information for processing.
 */
export interface CalcCallbackData {
  sessionData: Entities.SessionCallbackData,
  callbackData: Entities.CallbackData
}

/** Use case for handling calc callback.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class CalcCallbackUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.CALC,
    step: Entities.Step.CALC
  };

  constructor(
    @Inject(TOKENS.IIntegrationService) private readonly integrationService: Interfaces.IIntegrationService,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
    @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
  ) { }

  /**
   * Executes the use case for processing the calc callback.
   * 
   * @param data - The data containing session identifier and callback data
   */
  async execute(data: CalcCallbackData): Promise<void> {

    if (data.callbackData.status !== Entities.CallbackStatus.COMPLETED) {
      if (data.callbackData.status === Entities.CallbackStatus.ERROR) {
        const metaDataContext: Entities.MetaDataContext = { error: `Calc callback status is not success: ${data.callbackData.data}` };
        await this.trackingService.trackError(this.context, data.sessionData.id, `Calc callback status is not success: ${data.callbackData.data}`);
        await this.integrationService.processCalc(data.sessionData, metaDataContext);
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
      await this.integrationService.processCalc(data.sessionData, metaDataContext);
      return;
    }

    // The processing should be done in the integration service
    const metaDataContext: Entities.MetaDataContext = { metaData: metaData };
    try {
      await this.integrationService.processCalc(data.sessionData, metaDataContext);
    }
    catch (error) {
      const metaDataContext: Entities.MetaDataContext = { error: (error as Error).message };
      await this.trackingService.trackError(this.context, data.sessionData.id, `Error processing calc: ${(error as Error).message}`);
      await this.integrationService.processCalc(data.sessionData, metaDataContext);
      return;
    }
    await this.trackingService.trackSuccess(this.context, data.sessionData.id);
  }


}