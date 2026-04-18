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

import { Choice } from "../../core/entities/imports";
import { ControllerHelper } from "../utils/controllerHelper";
import { ProvisionUseCase, ProvisionData } from "../../application/useCases/provisionUseCase";

const upload = multer();

/**
 * Controller responsible for handling provisioning operations.
 * It processes a file upload and choice selection for provisioning.
 */
@Service()
@JsonController()
export class ProvisionController {
  constructor(
    @Inject() private readonly helper: ControllerHelper,
    @Inject() private readonly useCase: ProvisionUseCase,
  ) { }

  /**
   * Starts provisioning of the provided document based on the provided choice.
   * 
   * @route POST /provision
   * @param file - The file to be provisioned, uploaded as multipart/form-data  
   * 
   * @returns 200 OK - Success with session information
   * @returns 400 Bad Request - Validation error
   * @returns 404 Not Found - From use case
   * @returns 500 Internal Server Error - From use case
   */
  @Post("/provision")
  @UseBefore(upload.single('file'))
  async provision(
    @Req() req: Request, @Res() res: Response,
    @BodyParam("choice") choice: Choice,
  ) {
    return await this.helper.withErrorHandling(async () => {
      // Inialize indexing and get file type
      const file = req.file as Express.Multer.File;
      const fileType = this.helper.initIndexing(file);
      // Execute the use case
      const data: ProvisionData = {
        documentType: fileType,
        stream: Readable.from(file.buffer),
      }
      const session = await this.useCase.execute(data);
      return { session: session };
    }, res);
  }
}
