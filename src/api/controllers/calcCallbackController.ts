import {
    JsonController,
    Post,
    Req,
    Res,
    QueryParam,
    QueryParams,
    Body,
    HeaderParam
} from "routing-controllers";
import { Inject, Service } from "typedi";
import { Request, Response } from "express";

import { Callback, CallbackData } from "../../core/entities/callback";
import { ControllerHelper } from "../utils/controllerHelper";
import { CalcCallbackUseCase, CalcCallbackData } from "../../application/useCases/calcCallbackUseCase";
import { SessionQueryParams } from "../utils/sessionQueryParam";

/**
 * Controller responsible for handling calc callbacks.
 * It processes various callback types related to calculation operations.
 */
@Service()
@JsonController("/callback")
export class CalcCallbackController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: CalcCallbackUseCase,
    ) { }

    /**
     * Handles calc callback.
     *
     * @route POST /callback/calc
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.CALC}`)
    async calc(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.CALC}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: CalcCallbackData = {
                sessionData: session,
                callbackData: callbackData
            };
            await this.useCase.execute(data);
        }, res);
    }
}