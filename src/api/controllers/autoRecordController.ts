
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
import { BadRequestError } from "../../core/entities/error";
import { ChoiceService } from "../../infrastructure/services/choiceService";
import { Choice } from "../../core/entities/choice";
import { FileTypeService } from "../../infrastructure/services/fileTypeService";
import { AutoRecordUseCase, AutoRecordData } from "../../application/useCases/autoRecordUseCase";

const upload = multer();

/**
 * Controller responsible for handling auto-recording operations.
 * It processes a file upload and choice selection for auto-recording.
 */
@Service()
@JsonController()
export class AutoRecordController {
  constructor(
    @Inject() private readonly helper: ControllerHelper,
    @Inject() private readonly useCase: AutoRecordUseCase,
    @Inject() private readonly choiceService: ChoiceService,
    @Inject() private readonly fileTypeService: FileTypeService,
  ) { }

  /**
   * Starts auto-recording of the provided document based on the provided choice.
   * 
   * @route POST /autorecord
   * @param file - The file to be auto-recorded, uploaded as multipart/form-data  
   * @param choice - The choice payload containing items to auto-record
   * 
   * @returns 200 OK - Success with session information
   * @returns 400 Bad Request - Validation error
   * @returns 404 Not Found - From use case
   * @returns 500 Internal Server Error - From use case
   */
  @Post("/autorecord")
  @UseBefore(upload.single('file'))
  async autorecord(
    @Req() req: Request, @Res() res: Response,
  ) {
    return await this.helper.withErrorHandling(async () => {
      // Inialize indexing and get file type
      const file = req.file as Express.Multer.File;
      const fileType = this.helper.initIndexing(file);
      // Execute the use case
      const data: AutoRecordData = {
        documentType: fileType,
        stream: Readable.from(file.buffer),
      }
      const session = await this.useCase.execute(data);
      return { session: session };
    }, res);
  }
}
