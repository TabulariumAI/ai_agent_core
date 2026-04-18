import { Service, Inject } from "typedi";
import { Response, Request } from "express";

import { TokenService, FileTypeService, ChoiceService } from "../../infrastructure/services/imports";
import { BadRequestError, AuthorizationError, InternalError, NotFoundError } from "../../core/entities/error";
import { CallbackData, CallbackStatus } from "../../core/entities/callback";
import { Choice } from "../../core/entities/choice";


/** Controller helper class.
 * Contains common methods used across different controllers.
 * It provides methods for error handling, token validation, and initializing indexing.
 * This class is used to assist controllers in handling requests and responses.
 */
@Service()
export class ControllerHelper {

  constructor(
    @Inject() private readonly tokenService: TokenService,
    @Inject() private readonly fileTypeService: FileTypeService,
    @Inject() private readonly choiceService: ChoiceService,
  ) { }

  /**
   * Handles errors in a standardized way.
   * 
   * @param action - The action to execute
   * @param res - The response object to send the error response
   * @returns {Promise<T | Response>} - Returns the result of the action or an error response
   */
  async withErrorHandling<T>(
    action: () => Promise<T>,
    //req: Request,
    res: Response
  ): Promise<T | Response> {
    
    try {
      //req.headers.authorization;
      return await action();
    } catch (error) {
      if (error instanceof NotFoundError) {
        return res.status(404).send({ error: error.message });
      }
      else if (error instanceof AuthorizationError) {
        return res.status(401).send({ error: error.message });
      }
      else if (error instanceof BadRequestError) {
        return res.status(400).send({ error: error.message });
      }
      else if (error instanceof InternalError) {
        return res.status(500).send({ error: error.message });
      }
      else {
        return res.status(500).send({ error: "Internal server error" });
      }
    }
  }

  /**
   * Handles callback errors in a standardized way.
   * 
   * @param tokenData - The token data for validation
   * @param token - The token to validate
   * @param data - The callback data to process
   * @param action - The action to execute with the callback data
   * @param res - The response object to send the error response
   * @returns {Promise<Response>} - Returns the response after processing the callback
   */
  async withCallbackErrorHandling<T>(
    tokenData: string,
    token: string,
    data: CallbackData,
    action: (data: CallbackData) => Promise<T>,
    res: Response,

  ): Promise<Response> {
    try {
      // Validate the token
      if (!this.tokenService.validate(tokenData, token)) {
        throw new AuthorizationError("Invalid token");
      }
      // Validate the callback data
      if (!data || !data.status || data.status !== CallbackStatus.COMPLETED) {
        throw new BadRequestError("Callback data is invalid or missing status");
      }
      await action(data);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return res.status(401).send({ error: error.message });
      }
      else if (error instanceof BadRequestError) {
        return res.status(400).send({ error: error.message });
      }
    }
    return res.status(200).send({});
  }

  initIndexing(
    file: Express.Multer.File,
  ): string {
    let fileType = "";
    try {
      fileType = this.fileTypeService.getFileType(file.mimetype);
    } catch (error) {
      throw new BadRequestError("Invalid request: no file uploaded or unsupported file type");
    }

    return fileType;
  }

}


