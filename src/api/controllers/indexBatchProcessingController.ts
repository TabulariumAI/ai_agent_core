
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
import { IndexProcessingData, IndexProcessingUseCase } from "../../application/useCases/indexProcessingUseCase";

/**
 * Controller responsible for handling batch processing operations for indexing.
 * It initiates the indexing process for a batch of tasks.
 */

@Service()
@JsonController()
export class IndexBatchProcessingController {

    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: IndexProcessingUseCase,
    ) { }

    /**
     * Starts the indexing process for a batch of tasks.
     * @route POST /batch/index/:batch
     * @returns 200 OK - Success
     * @returns 400 Bad Request - Validation error
     * @returns 404 Not Found - From use case
     * @returns 500 Internal Server Error - From use case
     */
    @Post("/batch/index/:batch")
    async indexBatch(
        @Req() req: Request, @Res() res: Response,
        @Param("batch") batch: string,
    ) {
        return await this.helper.withErrorHandling(async () => {
            const data: IndexProcessingData = { type: Entities.BatchType.Index, batch };
            await this.useCase.execute(data);
            return {};
        }, req, res);

    }

}

