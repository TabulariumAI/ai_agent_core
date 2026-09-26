import {
    JsonController,
    Post,
    Req,
    Res,
    QueryParam,
    Body,
    HeaderParam,
    QueryParams
} from "routing-controllers";
import { Inject, Service } from "typedi";
import { Request, Response } from "express";

import { Callback, CallbackData } from "../../core/entities/callback";
import { ControllerHelper } from "../utils/controllerHelper";
import { AutoRedactCallbackIndexUseCase, AutoRedactCallbackIndexData } from "../../application/useCases/autoRedactCallbackIndexUseCase";
import { AutoRedactCallbackRedactUseCase, AutoRedactCallbackRedactData } from "../../application/useCases/autoRedactCallbackRedactUseCase";
import { SessionQueryParams } from "../utils/sessionQueryParam";

/**
 * Controller responsible for handling auto-redact callbacks.
 * It processes various callback types related to auto-redaction operations.
 */
@Service()
@JsonController("/callback")
export class AutoRedactCallbackController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly autoRedactCallbackRedactUseCase: AutoRedactCallbackRedactUseCase,
        @Inject() private readonly autoRedactCallbackIndexUseCase: AutoRedactCallbackIndexUseCase,
    ) { }

    /**
     * Handles auto-redact index callback.
     *
     * @route POST /callback/autoredact/index
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.AUTOREDACT_INDEX}`)
    async autoRedactIndex(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.AUTOREDACT_INDEX}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const indexData: AutoRedactCallbackIndexData = { sessionData: session, callbackData: callbackData };
            await this.autoRedactCallbackIndexUseCase.execute(indexData);
        }, res);
    }

    /**
     * Handles auto-redact redact callback.
     *
     * @route POST /callback/autoredact/redact
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.AUTOREDACT_REDACT}`)
    async autoRedactRedact(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.AUTOREDACT_REDACT}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: AutoRedactCallbackRedactData = { sessionData: session, callbackData: callbackData };
            await this.autoRedactCallbackRedactUseCase.execute(data);
        }, res);
    }
}