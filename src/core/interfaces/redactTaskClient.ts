import * as Entities from "../entities/imports";
/**
 * Interface for redact task client.
 * Defines the contract for redacting content.
 */
export interface IRedactTaskClient {
  
  /**
   * Redacts the given content.
   * @param content - The content to be redacted.
   * @returns A promise that resolves to the redacted content as a string.
   */
  redact(content: Entities.Content): Promise<string>;
}