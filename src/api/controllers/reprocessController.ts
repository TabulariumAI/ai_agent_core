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

import { ControllerHelper } from "../utils/controllerHelper";
import { BadRequestError } from "../../core/entities/error"
import { SegmentService } from "../../infrastructure/services/segmentService";
import { ReprocessUseCase, ReprocessData } from "../../application/useCases/reprocessUseCase";

/**
 * Controller responsible for handling reprocess operations.
 * It reprocesses a specific session and document segment.
 */

@Service()
@JsonController()
export class ReprocessController {
    constructor(
        @Inject() private readonly helper: ControllerHelper,
        @Inject() private readonly useCase: ReprocessUseCase,
        @Inject() private readonly segmentService: SegmentService,
    ) { }

    /**
     * Starts reprocessing of a segment of a session's document based on the provided notice.
     *
     * @route POST /reprocess/:session/:segment
     * @param session - Session identifier
     * @param segment - Document segment identifier
     * @param notice - The notice payload containing text to reprocess
     *
     * @returns 200 OK - Success
     * @returns 400 Bad Request - Validation error
     * @returns 404 Not Found - From use case
     * @returns 500 Internal Server Error - From use case
     */
    @Post("/reprocess/:session/:segment")
    async refine(
        @Req() req: Request, @Res() res: Response,
        @Param("session") session: string,
        @Param("segment") segment: string,
    ) {
        return await this.helper.withErrorHandling(async () => {
            // Validate segment format
            if (!this.segmentService.validateSegment(segment)) {
                throw new BadRequestError("Invalid segment");
            }
            // Execute the use case
            const data: ReprocessData = {
                session: session,
                segment: segment,
            }
            await this.useCase.execute(data);
            return {};
        }, res);
    }
}
