
import  * as Entities  from "../entities/imports";

/**
 * Interface for Integration Service.
 * Provides methods for processing various types of data related to integration tasks.
 * Each method corresponds to a specific integration task such as indexing, refining, calculating, provisioning, redacting, endorsing, and auto-recording.
 */
/**
 * Defines the contract for integration services that process and manage various document operations.
 *
 * @remarks
 * This interface provides methods for processing, refining, calculating, provisioning, redacting,
 * endorsing, and recording document metadata or streams within a session context.
 */
export interface IIntegrationService {
  /**
   * Processes the indexing of metadata for a given session.
   * @param session - The session identifier.
   * @param context - The metadata to be indexed.
   * @returns A promise that resolves when the operation is complete.
   */
  processIndex(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void>;


  /**
   * Processes the refinement of metadata for a given session.
   * @param session - The session identifier.
   * @param context - The metadata to be refined.
   * @returns A promise that resolves when the operation is complete.
   */
  processRefine(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void>;

  /**
   * Processes calculations on metadata for a given session.
   * @param session - The session identifier.
   * @param context - The metadata to be used for calculations.
   * @returns A promise that resolves when the operation is complete.
   */
  processCalc(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void>;

  /**
   * Processes the provisioning of metadata for a given session.
   * @param session - The session identifier.
   * @param context - The metadata to be provisioned.
   * @returns A promise that resolves when the operation is complete.
   */
  processProvision(session: Entities.SessionCallbackData, context: Entities.MetaDataContext): Promise<void>;

  /**
   * Processes the redaction of data for a given session.
   * @param session - The session identifier.
   * @param context - The content containing the document data.
   * @returns A promise that resolves when the operation is complete.
   */
  processRedact(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void>;

  /**
   * Automatically processes the redaction of data for a given session.
   * @param session - The session identifier.
   * @param context - The content containing the document data.
   * @returns A promise that resolves when the operation is complete.
   */
  processAutoRedact(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void>;


  /**
   * Processes the endorsement of data for a given session.
   * @param session - The session identifier.
   * @param context - The content containing the document data.
   * @returns A promise that resolves when the operation is complete.
   */
  processEndorse(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void>;

  /**
   * Automatically records data for a given session.
   * @param session - The session identifier.
   * @param context - The content containing the document data for auto-recording.
   * @returns A promise that resolves when the operation is complete.
   */
  processAutoRecord(session: Entities.SessionCallbackData, context: Entities.ContentContext): Promise<void>;

  /**
   * Records metadata for a given session and returns the resulting metadata.
   * @param session - The session identifier.
   * @param metaData - The metadata to be recorded.
   * @returns A promise that resolves with the recorded metadata.
   */
  record(session: string, metaData: string): Promise<string>;
}
