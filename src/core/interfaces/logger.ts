/**
 * Interface for logger.
 * Defines the contract for logging messages with different severity levels.
 */
export interface ILogger {
  /**
   * Logs an informational message.
   * @param message - The message to be logged.
   */
  info(message: string): void;

  /**
   * Logs an error message.
   * @param message - The error message to be logged.
   */
  error(message: string): void;
}