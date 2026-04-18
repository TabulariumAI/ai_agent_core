import {
  JsonController,
  Post,
  Req,
  UseBefore,
  Res,
  BodyParam,
} from "routing-controllers";
import { Request, Response } from "express";
import { Inject, Service } from "typedi";
import multer from "multer";
import { Readable } from "stream";

import { Choice } from "../../core/entities/imports";
import { ControllerHelper } from "../utils/controllerHelper";
import { IndexUseCase, IndexData } from "../../application/useCases/indexUseCase";

const upload = multer();

/**
 * Controller responsible for handling indexing operations.
 * It processes a file upload and choice selection for indexing.
 */
@Service()
@JsonController()
export class IndexController {
  constructor(
    @Inject() private readonly helper: ControllerHelper,
    @Inject() private readonly useCase: IndexUseCase,
  ) { }
  /**
   * Starts indexing of the provided document based on the provided choice.
   * 
   * @route POST /index
   * @param file - The file to be indexed, uploaded as multipart/form-data  
   * 
   * @returns 200 OK - Success with session information
   * @returns 400 Bad Request - Validation error
   * @returns 404 Not Found - From use case
   * @returns 500 Internal Server Error - From use case
   */
  @Post("/index")
  @UseBefore(upload.single('file'))
  async index(
    @Req() req: Request, @Res() res: Response,
  ) {
    return await this.helper.withErrorHandling(async () => {
      // Inialize indexing and get file type
      const file = req.file as Express.Multer.File;
      const fileType = this.helper.initIndexing(file);
      // Execute the use case
      const data: IndexData = {
        documentType: fileType,
        stream: Readable.from(file.buffer),
      }
      const session = await this.useCase.execute(data);
      return { session: session };
    }, res);
  }
}
