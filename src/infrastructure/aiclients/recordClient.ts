import { Service, Inject } from "typedi";


import * as Entities from "../../core/entities/imports";
import { TokenService } from "../services/tokenService";
import { IRecordClient } from "../../core/interfaces/recordClient";
import { Config } from "../../config";
import { types } from "util";
import { FileTypeService } from "../services/fileTypeService";



/** Tabularium record client service.
 * Implements the ITabulariumRecordClient interface to interact with the Tabularium API.
 * This service provides methods for managing sessions, indexing documents, and handling feedback.
 */
@Service()
export class RecordClient implements IRecordClient {

    constructor(
        @Inject() private readonly tokenService: TokenService,
        @Inject() private readonly fileTypeService: FileTypeService,
        //@Inject(TOKENS.ITrackingService) private readonly trackingService: ITrackingService,
    ) { }


    async endorseDocument(context: Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, metaData: string, callback: Entities.Callback, taskCallbackData?: Entities.TaskCallbackData): Promise<void> {
        const url = Config.record.document(sessionCallbackData.id);
        const format = Config.formats.recordFormat;
        
        let path = `${callback}?${sessionCallbackData.getPath()}`;
        const token = this.tokenService.sign(path);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${Config.apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "data": metaData,
                "choices": {
                    "tif_record": this.fileTypeService.isTiff(format) ? true : false,
                    "pdf_record": this.fileTypeService.isPdf(format) ? true : false,
                    "pdf_confirmation": true,
                },
                "callback_url": `${Config.callback.url(path)}`,
                "callback_token": token,
            }),
        });

        if (!response.ok) {
            throw new Entities.InternalError(`Failed to endorse document: ${response.statusText}`);
        }
    }

}