import { Inject, Service } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for provision callback calc use case.
 * Contains session identifier and callback data. 
 * This interface is used to pass data to the use case for processing the provision callback.
 * @interface ProvisionCallbackCalcData
 * @property {Entities.SessionCallbackData} sessionData - The session data associated with the provision process, containing necessary information for processing.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback, containing necessary information for processing.
 */
export interface ProvisionCallbackCalcData {
  sessionData: Entities.SessionCallbackData,
  callbackData: Entities.CallbackData
}

/** * Use case for handling provision callback calculations.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class ProvisionCallbackCalcUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.PROVISION,
    step: Entities.Step.CALC
  };

  constructor(
    @Inject(TOKENS.IIntegrationService) private readonly integrationService: Interfaces.IIntegrationService,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
    @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
  ) { }

  /**
   * Executes the use case for processing the provision callback calculation.
   * 
   * @param data - The data containing session identifier and callback data
   */
  async execute(data: ProvisionCallbackCalcData): Promise<void> {

    if (data.callbackData.status !== Entities.CallbackStatus.COMPLETED) {
      if (data.callbackData.status === Entities.CallbackStatus.ERROR) {
        await this.trackingService.trackError(this.context, data.sessionData.id, `Callback status is not success: ${data.callbackData.data}`);
        await this.integrationService.processProvision(data.sessionData, { error: `Callback status is not success: ${data.callbackData.data}` } as Entities.MetaDataContext);
      }
        return;
    }
    
    let metaData: string;
    try {
      metaData = await this.blobService.downloadString(data.callbackData.data);
    }
    catch (error) {
      await this.trackingService.trackError(this.context, data.sessionData.id, `Error reading metadata from blob: ${data.callbackData.data}`);
      await this.integrationService.processProvision(data.sessionData, { error: (error as Error).message } as Entities.MetaDataContext);
      return;
    }

    // The processing should be done in the integration service
    const metaDataContext: Entities.MetaDataContext = { metaData: metaData };
    try {
      await this.integrationService.processProvision(data.sessionData, metaDataContext);
    }
    catch (error) {
      await this.trackingService.trackError(this.context, data.sessionData.id, `Error processing provision: ${(error as Error).message}`);
      await this.integrationService.processProvision(data.sessionData, { error: (error as Error).message } as Entities.MetaDataContext);
      return;
    }
    await this.trackingService.trackSuccess(this.context, data.sessionData.id);
  }

}