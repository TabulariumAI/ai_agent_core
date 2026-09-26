import { Service, Inject } from "typedi";
import { randomUUID } from "crypto";

import { Config } from "../../config";
import { TOKENS } from "../../core/tokens";

import * as Interfaces from "../../core/interfaces/imports";
import * as Entities from "../../core/entities/imports";
import { IndexTaskProcessor } from "../processors/indexTaskProcessor";
import { NotFoundError } from "routing-controllers";
import { getIndexProcessor } from "../processors/processorRegistry";

export interface IndexProcessingData {
  type: Entities.BatchType;
  batch: string;
}

@Service()
/**
 * Use case for indexing and processing batches of a specific type.
 */
export class IndexProcessingUseCase {

  constructor(
    @Inject(TOKENS.IBatchRepository) private readonly batchRepository: Interfaces.IBatchRepository,
    @Inject(TOKENS.IBatchSourceRepository) private readonly batchSourceRepository: Interfaces.IBatchSourceRepository,
    @Inject() private readonly processor: IndexTaskProcessor
  ) { }

  /**
     * Executes the use case to index and process batches of a specific type.
     * @param data - The data containing the batch type to be processed.
     */
  public async execute(data: IndexProcessingData): Promise<void> {
    const batch = await this.batchSourceRepository.getBatch(Config.batchIndexIn, data.batch);
    if (!batch) {
      throw new NotFoundError(`Batch ${data.batch} not found in ${Config.batchIndexIn}`);
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
          //status: Entities.BatchStatus.Starting,
        },
        sessionId: null,
        status: Entities.TaskStatus.Queued,
      }))
    };

    await this.batchRepository.createBatch(newBatch);
    await this.batchRepository.setBatchStatus(newBatch.detail, Entities.BatchStatus.Pending);
    await getIndexProcessor().addTasks(newBatch.items);

  }

}
