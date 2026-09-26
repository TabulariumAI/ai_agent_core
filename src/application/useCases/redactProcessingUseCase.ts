import { Service, Inject } from "typedi";
import { randomUUID } from "crypto";
import * as Entities from "../../core/entities/imports";
import { TOKENS } from "../../core/tokens";
import * as Interfaces from "../../core/interfaces/imports";
import { Config } from "../../config";
import { RedactTaskProcessor } from "../processors/redactTaskProcessor";
import { getRedactProcessor } from "../processors/processorRegistry";

export interface RedactProcessingData {
  type: Entities.BatchType;
  batch: string;
}

@Service()
/** * Use case for starting a processing of batches of a specific type.
 */
export class RedactProcessingUseCase {

  constructor(
    @Inject(TOKENS.IBatchRepository) private readonly batchRepository: Interfaces.IBatchRepository,
    @Inject(TOKENS.IBatchSourceRepository) private readonly batchSourceRepository: Interfaces.IBatchSourceRepository) { }

  /**
   * Executes the use case for starting a processing of batches of a specific type.
   * @param data - The data containing the batch type to be processed.
   */
  public async execute(data: RedactProcessingData): Promise<void> {
    const batch = await this.batchSourceRepository.getBatch(Config.batchRedactIn, data.batch);
    if (!batch) {
      throw new Error(`Batch ${data.batch} not found in ${Config.batchRedactIn}`);
    }

    const id = `${Date.now()}_${randomUUID()}`;
    const newBatch: Entities.Batch = {
      detail: {
        name: batch.name,
        type: data.type,
      },
      status: Entities.BatchStatus.None,
      items: batch.items.map((item, index) => ({
        id: `${id}_${String(index + 1).padStart(5, '0')}`,
        name: item,
        batch: {
          name: batch.name,
          type: data.type,
        },
        sessionId: null,
        status: Entities.TaskStatus.Queued,
      }))
    };

    await this.batchRepository.createBatch(newBatch);
    await this.batchRepository.setBatchStatus(newBatch.detail, Entities.BatchStatus.Pending);
    await getRedactProcessor().addTasks(newBatch.items);
  }
}
