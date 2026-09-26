import * as Entities from "../entities/imports";
/**
 * Interface for index task client.
 * Defines the contract for indexing content.
 */
export interface IIndexTaskClient {
  /**
   * Indexes the given content.
   * @param content - The content to be indexed.
   * @returns A promise that resolves to the result of the indexing operation as a string.
   */
  index(content: Entities.Content): Promise<string>;
}