import { Service, Inject } from "typedi";


import * as Entities from "../../core/entities/imports";
import { IRedactClient } from "../../core/interfaces/imports";
import { TokenService } from "../services/tokenService";
import { Config } from "../../config";
import { FileTypeService } from "../services/imports";



/** Tabularium redact client service.
 * Implements the ITabulariumRedactClient interface to interact with the Tabularium API.
 * This service provides methods for redaction-related operations.
 */
@Service()
export class RedactClient implements IRedactClient {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        @Inject() private readonly fileTypeService: FileTypeService,
        //@Inject(TOKENS.ITrackingService) private readonly trackingService: ITrackingService,
    ) { }

    async redactDocument(context: Entities.WorkflowContext, session: string, metaData: Entities.MetaData | null, callback: Entities.Callback): Promise<void> {
        const url = Config.redact.document(session);
        const format = Config.formats.redactFormat;

        const path = `${callback}?sn=${session}`;
        const token = this.tokenService.sign(path);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "data": metaData ? metaData : null,
                "choices": {
                    "tif_redaction": this.fileTypeService.isTiff(format) ? true : false,
                    "pdf_redaction": this.fileTypeService.isPdf(format) ? true : false,
                },
                "callback_url": `${Config.callback.url(path)}`,
                "callback_token": token,
            }),
        });

        if (!response.ok) {
            throw new Entities.InternalError(`Failed to redact document: ${response.statusText}`);
        }
    }

}