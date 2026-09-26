import { Inject, Service } from "typedi";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/** Data structure for provision callback index use case.
 * Contains session identifier and callback data.
 * This interface is used to pass data to the use case for processing the provision callback index.
 * @interface ProvisionCallbackIndexData
 * @property {Entities.SessionCallbackData} sessionData - The session data associated with the provision process, containing necessary information for processing.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback, containing necessary information for processing.
 */
export interface ProvisionCallbackIndexData {
  sessionData: Entities.SessionCallbackData,
  callbackData: Entities.CallbackData
}

/** Use case for handling provision callback index.
 * It processes the document and triggers the next step in the workflow.
 */
@Service()
export class ProvisionCallbackIndexUseCase {
  private readonly context:Entities.WorkflowContext = {
    workflow: Entities.Workflow.PROVISION,
    step: Entities.Step.INDEX
  };
  private readonly nextContext:Entities.WorkflowContext = {
    workflow: Entities.Workflow.PROVISION,
    step: Entities.Step.CALC
  };

  constructor(
    @Inject(TOKENS.IComputeClient) private readonly computeClient: Interfaces.IComputeClient,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
  ) { }

  /**
   * Executes the use case for processing the provision callback index.
   * 
   * @param data - The data containing session identifier and callback information
   */
  async execute(data: ProvisionCallbackIndexData): Promise<void> {
    if (data.callbackData.status != Entities.CallbackStatus.COMPLETED) {
      if (data.callbackData.status == Entities.CallbackStatus.ERROR) {
        {
          await this.trackingService.trackError(this.context, data.sessionData.id, `Provision index callback status is not completed: ${data.callbackData.data}`);
        }
        return;
      }
      return;
    }


    await this.trackingService.trackSuccess(this.context, data.sessionData.id);

    try {
      await this.computeClient.calcDocument(this.context, data.sessionData, null, Entities.Callback.PROVISION_CALC);
    }
    catch (error) {
      await this.trackingService.trackError(this.nextContext, data.sessionData.id,  error instanceof Error ? error.message : String(error));
      return;
    }
  }
}