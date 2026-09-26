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
import { ProvisionCallbackIndexUseCase, ProvisionCallbackIndexData } from "../../application/useCases/provisionCallbackIndexUseCase";
import { ProvisionCallbackCalcUseCase, ProvisionCallbackCalcData } from "../../application/useCases/provisionCallbackCalcUseCase";
import { SessionQueryParams } from "../utils/sessionQueryParam";

/**
 * Controller responsible for handling provision callbacks.
 * It processes various callback types related to provisioning operations.
 */
@Service()
@JsonController("/callback")
export class ProvisionCallbackController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly provisionCallbackIndexUseCase: ProvisionCallbackIndexUseCase,
        @Inject() private readonly provisionCallbackCalcUseCase: ProvisionCallbackCalcUseCase,
    ) { }

    /**
     * Handles provision index callback.
     *
     * @route POST /callback/provision/index
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.PROVISION_INDEX}`)
    async provisionIndex(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.PROVISION_INDEX}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: ProvisionCallbackIndexData = { sessionData: session, callbackData: callbackData };
            await this.provisionCallbackIndexUseCase.execute(data);
        }, res);
    }

    /**
     * Handles provision calculation callback.
     *
     * @route POST /callback/provision/calc
     * @param session - The session information from the query parameters
     * @param token - The authorization token from the header
     * @param body - The callback data in the request body
     *
     * @returns 200 OK
     * @returns 401 Unauthorized - Invalid token
     * @returns 400 Bad Request - Invalid callback data
     */
    @Post(`/${Callback.PROVISION_CALC}`)
    async provisionCalc(
        @Req() req: Request, @Res() res: Response,
        @QueryParams() sessionParam: SessionQueryParams,
        @HeaderParam("Authorization") token: string,
        @Body() callbackData: CallbackData
    ) {
        const session = sessionParam.toSession();
        const tokenData = `${Callback.PROVISION_CALC}?${session.getPath()}`;
        return await this.helper.withCallbackErrorHandling(tokenData, token, callbackData, async () => {
            // Execute the use case
            const data: ProvisionCallbackCalcData = { sessionData: session, callbackData: callbackData };
            await this.provisionCallbackCalcUseCase.execute(data);
        }, res);
    }

}