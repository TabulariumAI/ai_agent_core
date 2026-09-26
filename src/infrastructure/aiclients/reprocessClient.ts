import { Service, Inject } from "typedi";


import * as Entities from "../../core/entities/imports";
import { IReprocessClient } from "../../core/interfaces/reprocessClient";
import { TokenService } from "../services/tokenService";
import { Config } from "../../config";



/** Tabularium reprocess client service.
 * Implements the IReprocessClient interface to interact with the Tabularium API.
 * This service provides methods for managing sessions, indexing documents, and handling feedback.
 */
@Service()
export class ReprocessClient implements IReprocessClient {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        //@Inject(TOKENS.ITrackingService) private readonly trackingService: ITrackingService,
    ) {}

    async reprocessDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, segment: string, callback: Entities.Callback): Promise<void> {
        const url = Config.reprocess.document(sessionCallbackData.id, segment); 

        let path = `${callback}?${sessionCallbackData.getPath()}`;
        const token = this.tokenService.sign(path);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "callback_url": Config.callback.url(path),
                "callback_token": token,
            }),
        });

        if (!response.ok) {
            throw new Entities.InternalError(`Failed to reprocess document: ${response.statusText}`);
        }
    }

}