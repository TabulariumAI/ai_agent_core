import { Readable } from "stream";

import { MetaData } from "../entities/metadata";
import { CallbackType } from "../entities/imports";

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
   * @param data - The metadata to be indexed.
   * @returns A promise that resolves when the operation is complete.
   */
  processIndex(session: string, data: MetaData): Promise<void>;

  /**
   * Processes the refinement of metadata for a given session.
   * @param session - The session identifier.
   * @param data - The metadata to be refined.
   * @returns A promise that resolves when the operation is complete.
   */
  processRefine(session: string, data: MetaData): Promise<void>;

  /**
   * Processes calculations on metadata for a given session.
   * @param session - The session identifier.
   * @param data - The metadata to be used for calculations.
   * @returns A promise that resolves when the operation is complete.
   */
  processCalc(session: string, data: MetaData): Promise<void>;

  /**
   * Processes the provisioning of metadata for a given session.
   * @param session - The session identifier.
   * @param data - The metadata to be provisioned.
   * @returns A promise that resolves when the operation is complete.
   */
  processProvision(session: string, data: MetaData): Promise<void>;

  /**
   * Processes the redaction of data for a given session.
   * @param session - The session identifier.
   * @param data - The readable stream containing data to be redacted.
   * @param type - The type of callback to be processed.
   * @returns A promise that resolves when the operation is complete.
   */
  processRedact(session: string, data: Readable, type: string): Promise<void>;

  /**
   * Automatically processes the redaction of data for a given session.
   * @param session - The session identifier.
   * @param data - The readable stream containing data to be auto-redacted.
   * @param type - The type of callback to be processed.
   * @returns A promise that resolves when the operation is complete.
   */
  processAutoRedact(session: string, data: Readable, type: string): Promise<void>;

  /**
   * Processes the endorsement of data for a given session.
   * @param session - The session identifier.
   * @param data - The readable stream containing data to be endorsed.
   * @param type - The type of callback to be processed.
   * @returns A promise that resolves when the operation is complete.
   */
  processEndorse(session: string, data: Readable, type: string): Promise<void>;

  /**
   * Automatically records data for a given session.
   * @param session - The session identifier.
   * @param data - The readable stream containing data to be auto-recorded.
   * @param type - The type of callback to be processed.
   * @returns A promise that resolves when the operation is complete.
   */
  processAutoRecord(session: string, data: Readable, type: string): Promise<void>;

  /**
   * Records metadata for a given session and returns the resulting metadata.
   * @param session - The session identifier.
   * @param metaData - The metadata to be recorded.
   * @returns A promise that resolves with the recorded metadata.
   */
  record(session: string, data: MetaData): Promise<MetaData>;
}
