import { Service, Inject } from "typedi";


import * as Entities from "../../core/entities/imports";
import { TokenService } from "../services/tokenService";
import { IIndexClient } from "../../core/interfaces/indexClient";
import { Config } from "../../config";



/** Tabularium index client service.
 * Implements the ITabulariumIndexClient interface to interact with the Tabularium API.
 * This service provides methods for managing sessions, indexing documents, and handling feedback.
 */
@Service()
export class IndexClient implements IIndexClient {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        //@Inject(TOKENS.ITrackingService) private readonly trackingService: ITrackingService,
    ) {}

    async indexDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, document: string, choices: Entities.ChoiceItem[], callback: Entities.Callback): Promise<void> {
        const url = Config.index.document(sessionCallbackData.id);
        let path = `${callback}?${sessionCallbackData.getPath()}`;
        const token = this.tokenService.sign(path);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "doc_name": document,
                "choices": choices,
                "callback_url": Config.callback.url(path),
                "callback_token": token,
            }),
        });

        if (!response.ok) {
            throw new Entities.InternalError(`Failed to index document: ${response.statusText}`);
        }
    }


}