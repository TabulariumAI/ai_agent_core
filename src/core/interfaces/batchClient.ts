/**
 * Interface for batch client.
 * Defines the methods for managing batch sessions.
 */
export interface IBatchClient {
  /**
   * Creates a new session for a batch.
   * @param name - The name of the session.
   * @param batch - The ID of the batch.
   */
  createSession(name: string, batch: string): Promise<void>;
}