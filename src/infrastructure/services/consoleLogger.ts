import { Service } from "typedi";
import { ILogger } from "../../core/interfaces/logger";
@Service()
/**
 * A simple console-based logger implementation of the ILogger interface.
 */

export class ConsoleLogger implements ILogger {
  info(message: string): void {
    console.log(`INFO: ${message}`);
  }

  error(message: string): void {
    console.error(`ERROR: ${message}`);
  }
}