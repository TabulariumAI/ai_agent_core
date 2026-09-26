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
import { ReprocessCallbackUseCase, ReprocessCallbackData } from "../../application/useCases/reprocessCallbackUseCase";
import { SessionQueryParams } from "../utils/sessionQueryParam";

/**
 * Controller responsible for handling reprocess callbacks.
 * It processes various callback types related to reprocessing operations.
 */
@Service()
@JsonController("/callback")
export class ReprocessCallbackController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: ReprocessCallbackUseCase,
    ) { }

    /**
     * Handles reprocess callback.
     *
     * @route POST /callback/reprocess
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.REPROCESS}`)
    async index(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.REPROCESS}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: ReprocessCallbackData = {
                sessionData: session,
                callbackData: callbackData
            };
            await this.useCase.execute(data);
        }, res);
    }
}