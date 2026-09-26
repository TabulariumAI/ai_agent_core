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
import { RedactCallbackUseCase, RedactCallbackData } from "../../application/useCases/redactCallbackUseCase";
import { SessionQueryParams } from "../utils/sessionQueryParam";

/**
 * Controller responsible for handling redact callbacks.
 * It processes various callback types related to redacting operations.
 */
@Service()
@JsonController("/callback")
export class RedactCallbackController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: RedactCallbackUseCase,
    ) { }

    /**
     * Handles redact callback.
     *
     * @route POST /callback/redact
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.REDACT}`)
    async index(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.REDACT}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: RedactCallbackData = {
                sessionData: session,
                callbackData: callbackData
            };
            await this.useCase.execute(data);
        }, res);
    }
}