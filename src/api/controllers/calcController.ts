import {
    JsonController,
    Post,
    Req,
    Res,
    Param,
    Body,
} from "routing-controllers";
import { Request, Response } from "express";
import { Inject, Service } from "typedi";
import * as Entities from "../../core/entities/imports";

import { ControllerHelper } from "../utils/controllerHelper";
import { CalcUseCase, CalcData } from "../../application/useCases/calcUseCase";

/**
 * Controller responsible for handling calculation operations.
 * It processes a metadata for a specific session.
 */
@Service()
@JsonController()
export class CalcController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: CalcUseCase,
    ) { }

    /**
     * Starts calculation based on the provided metadata for a session.
     *
     * @route POST /calc/:session
     * @param session - The session query parameters containing session, batch, and task identifiers
     * @param metaData - The metadata payload containing information for calculation
     *
     * @returns 200 OK - Success
     * @returns 400 Bad Request - Validation error
     * @returns 404 Not Found - From use case
     * @returns 500 Internal Server Error - From use case
     */
    @Post("/calc/:session")
    async calc(
        @Req() req: Request, @Res() res: Response,
        @Param("session") session: string,
        @Body() metaData: string | null,
    ) {
        return await this.helper.withErrorHandling(async () => {
            // Execute the use case
            const data: CalcData = {
                sessionData: new Entities.SessionCallbackData(session),
                metaData: metaData
            }
            await this.useCase.execute(data);
            return {};
        }, req, res);
    }
}
