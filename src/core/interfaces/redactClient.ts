import * as Entities from '../entities/imports';

/** Interface for Redact Service Client.
 * This interface defines the methods for interacting with the Tabularium API.
 * It includes methods for document redaction.
 */
export interface IRedactClient {
    /**
     * Redacts a document with metadata and callback.
     * @param context - The workflow context containing workflow and step information.
     * @param sessionCallbackData - The session callback data for the document.
     * @param metaData - The metadata associated with the document, can be null if not available.
     * @param callback - The callback type for the operation.
     * 
     * @returns A promise that resolves when the redaction is complete.
     */
    redactDocument(context:Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, metaData: string | null, callback: Entities.Callback): Promise<void>;
}