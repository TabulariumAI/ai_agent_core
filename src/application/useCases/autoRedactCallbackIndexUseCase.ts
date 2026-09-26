import { Inject, Service } from "typedi";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";


/**
 * Data structure for auto-redact index callback use case.
 * Contains session identifier and callback data.
 * @interface AutoRedactCallbackIndexData
 * @property {Entities.SessionCallbackData} sessionData - The session information for the callback.
 * @property {Entities.CallbackData} callbackData - The data associated with the callback.
 * 
 * This interface is used to pass data to the use case for processing auto-redact index callbacks.
 */
export interface AutoRedactCallbackIndexData {
  sessionData: Entities.SessionCallbackData,
  callbackData: Entities.CallbackData
}


@Service()
export class AutoRedactCallbackIndexUseCase {
  private readonly context: Entities.WorkflowContext = {
    workflow: Entities.Workflow.AUTOREDACT,
    step: Entities.Step.INDEX
  };
  private readonly nextContext: Entities.WorkflowContext = {
    workflow: Entities.Workflow.AUTOREDACT,
    step: Entities.Step.REDACT
  };

  constructor(
    @Inject(TOKENS.IRedactClient) private readonly redactClient: Interfaces.IRedactClient,
    @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
  ) { }

  /**
   * Executes the use case for processing the auto-redact index callback.
   * 
   * @param data - The data containing session and callback information
   */
  async execute(data: AutoRedactCallbackIndexData): Promise<void> {
    if (data.callbackData.status != Entities.CallbackStatus.COMPLETED) {
      if (data.callbackData.status == Entities.CallbackStatus.ERROR) {
        {
          await this.trackingService.trackError(this.context, data.sessionData.id, `Auto-redact index callback status is not completed: ${data.callbackData.data}`);
        }
        return;
      }
      return;
    }
    await this.trackingService.trackSuccess(this.context, data.sessionData.id);

    try {
      await this.redactClient.redactDocument(this.context, data.sessionData, null, Entities.Callback.AUTOREDACT_REDACT);
    }
    catch (error) {
      await this.trackingService.trackError(this.nextContext, data.sessionData.id, error instanceof Error ? error.message : String(error));
      return;
    }
  }
}