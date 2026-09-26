import { Inject, Service } from "typedi";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";


/** * Data structure for auto-record index callback use case.
 * Contains session identifier and callback data.
 * @interface AutoRecordCallbackIndexData
 * @property {Entities.SessionCallbackData} sessionData - The session information for the callback.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback.
 * * This interface is used to pass data to the use case for processing auto-record index callbacks.
 */
export interface AutoRecordCallbackIndexData {
  sessionData: Entities.SessionCallbackData,
  callbackData: Entities.CallbackData
}


/**
 * Use case for handling auto-record index callbacks.
 * It processes the callback data and triggers the next step in the workflow.
 */
@Service()
export class AutoRecordCallbackIndexUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.AUTORECORD,
    step: Entities.Step.INDEX
  };
  private readonly nextContext: Entities.WorkflowContext = {
    workflow: Entities.Workflow.AUTORECORD,
    step: Entities.Step.CALC
  };

  constructor(
    @Inject(TOKENS.IComputeClient) private readonly computeClient: Interfaces.IComputeClient,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
  ) { }

  /**
   * Executes the use case for processing the auto-record index callback.
   * 
   * @param data - The data containing session and callback information
   */
  async execute(data: AutoRecordCallbackIndexData): Promise<void> {
    
    if (data.callbackData.status != Entities.CallbackStatus.COMPLETED) {
      if (data.callbackData.status == Entities.CallbackStatus.ERROR) {
        {
          await this.trackingService.trackError(this.context, data.sessionData.id, `Auto-record index callback status is not completed: ${data.callbackData.data}`);
        }
        return;
      }
      return;
    }

    await this.trackingService.trackSuccess(this.context, data.sessionData.id);

    try {
      await this.computeClient.calcDocument(this.context, data.sessionData, null, Entities.Callback.AUTORECORD_CALC);
    }
    catch (error) {
      await this.trackingService.trackError(this.nextContext, data.sessionData.id, error instanceof Error ? error.message : String(error));
      return;
    }
  }
}