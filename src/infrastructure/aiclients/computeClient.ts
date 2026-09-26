import { Service, Inject } from "typedi";


import * as Entities from "../../core/entities/imports";
import { TokenService } from "../services/tokenService";

import { IComputeClient } from "../../core/interfaces/imports";
import { Config } from "../../config";



/** Tabularium compute client service.
 * Implements the ITabulariumComputeClient interface to interact with the Tabularium API.
 * This service provides methods for computation-related operations.
 */
@Service()
export class ComputeClient implements IComputeClient {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        //@Inject(TOKENS.ITrackingService) private readonly trackingService: ITrackingService,
    ) {}


    async calcDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, metaData: string | null, callback: Entities.Callback): Promise<void> {

        const url = Config.compute.calculate(sessionCallbackData.id);

        const path = `${callback}?${sessionCallbackData.getPath()}`;
        const token = this.tokenService.sign(path);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "data": metaData ? metaData : null,
                "callback_url": Config.callback.url(path),
                "callback_token": token,
            }),

        });

        if (!response.ok) {
            throw new Entities.InternalError(`Failed to calculat document: ${response.statusText}`);
        }

    }

}