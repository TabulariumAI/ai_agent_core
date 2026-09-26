import * as Entities from '../entities/imports';

/** Interface for Record Service Client.
 * This interface defines the methods for interacting with the Tabularium API.
 * It includes methods for document endorsement.
 */
export interface IRecordClient {
    /**
     * Endorses a document with metadata and callback, if any.
     * @param context - The workflow context containing workflow and step information.
     * @param sessionCallbackData - The session and task information for the document.
     * @param metaData - The metadata associated with the document, can be null if not available.
     * @param callback - The callback type for the operation.
     * @param taskCallbackData - Additional data to be sent with the callback, if any.
     * @returns A promise that resolves when the endorsement is complete.
     */
    endorseDocument(context:Entities.WorkflowContext, sessionCallbackData: Entities.SessionCallbackData, metaData: string, callback: string): Promise<void>;
}