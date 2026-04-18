
import {
  JsonController,
  Post,
  Req,
  Res,
  UseBefore,
  BodyParam,
} from "routing-controllers";
import { Request, Response } from "express";
import { Inject, Service } from "typedi";
import multer from "multer";
import { Readable } from "stream";

import { ControllerHelper } from "../utils/controllerHelper";
import { Choice } from "../../core/entities/choice";
import { AutoRedactUseCase, AutoRedactData } from "../../application/useCases/autoRedactUseCase";

const upload = multer();

/**
 * Controller responsible for handling auto-redaction operations.
 * It processes a file upload and choice selection for auto-redaction.
 */
@Service()
@JsonController()
export class AutoRedactController {
  constructor(
    @Inject() private readonly helper: ControllerHelper,
    @Inject() private readonly useCase: AutoRedactUseCase,
  ) { }
  /**
   * Starts auto-redaction of the provided document based on the provided choice.
   * 
   * @route POST /autoredact
   * @param file - The file to be auto-redacted, uploaded as multipart/form-data  
   * 
   * @returns 200 OK - Success with session information
   * @returns 400 Bad Request - Validation error
   * @returns 404 Not Found - From use case
   * @returns 500 Internal Server Error - From use case
   */
  @Post("/autoredact")
  @UseBefore(upload.single('file'))
  async autoredact(
    @Req() req: Request, @Res() res: Response,
  ) {
    return await this.helper.withErrorHandling(async () => {
      // Inialize indexing and get file type
      const file = req.file as Express.Multer.File;
      const fileType = this.helper.initIndexing(file);
      // Execute the use case
      const data: AutoRedactData = {
        documentType: fileType,
        stream: Readable.from(file.buffer),
      }
      const session = await this.useCase.execute(data);
      return { session: session };
    }, res);
  }
}
