import {
    JsonController,
    Post,
    Req,
    Res,
    QueryParam,
    QueryParams,
    HeaderParam,
    Body,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import { Request, Response } from "express";

import { Callback, CallbackData } from "../../core/entities/callback";
import { ControllerHelper } from "../utils/controllerHelper";
import { AutoRecordCallbackIndexUseCase, AutoRecordCallbackIndexData } from "../../application/useCases/autoRecordCallbackIndexUseCase";
import { AutoRecordCallbackCalcUseCase, AutoRecordCallbackCalcData } from "../../application/useCases/autoRecordCallbackCalcUseCase";
import { AutoRecordCallbackEndorseUseCase, AutoRecordCallbackEndorseData } from "../../application/useCases/autoRecordCallbackEndorseUseCase";
import { SessionQueryParams } from "../utils/sessionQueryParam";

/**
 * Controller responsible for handling auto-record callbacks.
 * It processes various callback types related to auto-recording operations.
 */
@Service()
@JsonController("/callback")
export class AutoRecordCallbackController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly autoRecordCallbackIndexUseCase: AutoRecordCallbackIndexUseCase,
        @Inject() private readonly autoRecordCallbackCalcUseCase: AutoRecordCallbackCalcUseCase,
        @Inject() private readonly autoRecordCallbackEndorseUseCase: AutoRecordCallbackEndorseUseCase,
    ) { }

    /**
     * Handles auto-record index callback.
     * 
     * @route POST /callback/autorecord/index
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     * 
     * @returns 200 OK 
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.AUTORECORD_INDEX}`)
    async autoRecordIndex(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.AUTORECORD_INDEX}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: AutoRecordCallbackIndexData = { sessionData: session, callbackData: callbackData };
            await this.autoRecordCallbackIndexUseCase.execute(data);
        }, res);
    }

    /**
     * Handles auto-record calculation callback.
     * 
     * @route POST /callback/autorecord/calc
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     * 
     * @returns 200 OK 
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.AUTORECORD_CALC}`)
    async autoRecordCalc(
        @Req() req: Request, @Res() res: Response,
        @HeaderParam("Authorization") token: string,
        @QueryParams() sessionParam: SessionQueryParams,
        @Body() callbackData: CallbackData,
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.AUTORECORD_CALC}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: AutoRecordCallbackCalcData = { sessionData: session, callbackData: callbackData };
            await this.autoRecordCallbackCalcUseCase.execute(data);
        }, res);
    }

    /**
     * Handles auto-record endorse callback.
     * 
     * @route POST /callback/autorecord/endorse
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     * 
     * @returns 200 OK 
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.AUTORECORD_ENDORSE}`)
    async autoRecordEndorse(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.AUTORECORD_ENDORSE}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: AutoRecordCallbackEndorseData  = { sessionData: session, callbackData: callbackData };
            await this.autoRecordCallbackEndorseUseCase.execute(data);
        }, res);
    }
}