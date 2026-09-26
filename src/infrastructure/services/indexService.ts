
import { Service, Inject } from "typedi";
import { Readable } from "stream";

import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";

/**
 * Service class for handling indexing operations.
 */
@Service()
export class IndexService {
    constructor(
        @Inject(TOKENS.IBlobService) private readonly blobService: Interfaces.IBlobService,
        @Inject(TOKENS.ISessionClient) private readonly sessionClient: Interfaces.ISessionClient,
        @Inject(TOKENS.IIndexClient) private readonly indexClient: Interfaces.IIndexClient,
        @Inject(TOKENS.ITrackingService) private readonly trackingService: Interfaces.ITrackingService,
    ) { }


    /**
     * Indexes a document and returns the session identifier.
     * 
     * @param context - The workflow context
     * @param documentType - The type of the document being indexed
     * @param stream - The stream of the document content
     * @param choice - The choices associated with the document
     * @param callback - The callback type for the operation
     * @returns {Promise<string>} - Returns the session identifier for the indexed document
     */
    async index(
        context: Entities.WorkflowContext,
        documentType: string,
        stream: Readable,
        choice: Entities.ChoiceItem[],
        callback: string,
        taskData?: Entities.TaskCallbackData,
    ): Promise<string> {
        let session: string;
        let token: Entities.SessionToken;
        let currentContext = context;

        currentContext.step = Entities.Step.SESSION;
        try {
            session = await this.sessionClient.createSession(context, documentType);
            token = await this.sessionClient.getSession(context, session);
            await this.trackingService.trackSuccess(currentContext, session);
        }
        catch (error) {
            const message = "Failed to create session";
            await this.trackingService.trackError(currentContext, "", message);
            throw new Entities.InternalError(message);
        }

        currentContext.step = Entities.Step.UPLOAD;
        const document = `${session}.${documentType}`;
        const url = `${token.baseUrl}/${document}?${token.token}`;
        try {
            await this.blobService.upload(url, stream);
            await this.trackingService.trackSuccess(currentContext, session);
        } catch (error) {
            const message = "Failed to upload document";
            await this.trackingService.trackError(currentContext, session, message);
            throw new Entities.InternalError(message);
        }

        currentContext.step = Entities.Step.INDEX;
        const sessionData = new Entities.SessionCallbackData(session, taskData);
        try {
            await this.indexClient.indexDocument(context, sessionData, document, choice, callback);
        }
        catch (error) {
            const message = "Failed to index document";
            await this.trackingService.trackError(context, session, message);
            throw new Entities.InternalError(message);
        }

        return session;
    }


}
