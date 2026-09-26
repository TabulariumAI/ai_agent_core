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
import { EndorseCallbackUseCase, EndorseCallbackData } from "../../application/useCases/endorseCallbackUseCase";
import { SessionQueryParams } from "../utils/sessionQueryParam";

/**
 * Controller responsible for handling endorse callbacks.
 * It processes various callback types related to endorsing operations.
 */
@Service()
@JsonController("/callback")
export class EndorseCallbackController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: EndorseCallbackUseCase,
    ) { }

    /**
     * Handles endorse callback.
     *
     * @route POST /callback/endorse
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.ENDORSE}`)
    async endorse(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.ENDORSE}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: EndorseCallbackData = {
                sessionData: session,
                callbackData: callbackData
            };
            await this.useCase.execute(data);
        }, res);
    }
}