
import {
    JsonController,
    Post,
    Req,
    Res,
    Param,
} from "routing-controllers";
import { Inject, Service } from "typedi";
import { Request, Response } from "express";
import * as Entities from "../../core/entities/imports";
import { ControllerHelper } from "../utils/controllerHelper";
import { RedactProcessingData, RedactProcessingUseCase } from "../../application/useCases/redactProcessingUseCase";

/**
 * Controller responsible for handling batch processing operations for redaction.
 * It initiates the redaction process for a batch of tasks.
 */

@Service()
@JsonController()
export class RedactBatchProcessingController {

    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: RedactProcessingUseCase,
    ) { }

    /**
     * Starts the redaction process for a batch of tasks.
     * @route POST /batch/redact/:batch
     * @returns 200 OK - Success
     * @returns 400 Bad Request - Validation error
     * @returns 404 Not Found - From use case
     * @returns 500 Internal Server Error - From use case
     */
    @Post("/batch/redact/:batch")
    async redactBatch(
        @Req() req: Request, @Res() res: Response,
        @Param("batch") batch: string,
    ) {
        return await this.helper.withErrorHandling(async () => {
            const data: RedactProcessingData = { type: Entities.BatchType.Redact, batch };
            await this.useCase.execute(data);
            return {};
        }, req, res);

    }

}

