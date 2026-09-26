import 'reflect-metadata';

const indexProcessor = { addTasks: jest.fn().mockResolvedValue(undefined) };
const redactProcessor = { addTasks: jest.fn().mockResolvedValue(undefined) };

jest.mock('../../config', () => ({
  Config: { batchIndexIn: 'index-in', batchRedactIn: 'redact-in' },
}));
jest.mock('../../application/processors/processorRegistry', () => ({
  getIndexProcessor: () => indexProcessor,
  getRedactProcessor: () => redactProcessor,
}));
jest.mock('../../application/processors/indexTaskProcessor', () => ({ IndexTaskProcessor: class IndexTaskProcessor {} }));
jest.mock('../../application/processors/redactTaskProcessor', () => ({ RedactTaskProcessor: class RedactTaskProcessor {} }));

import { IndexProcessingUseCase } from '../../application/useCases/indexProcessingUseCase';
import { RedactProcessingUseCase } from '../../application/useCases/redactProcessingUseCase';
import { BatchStatus, BatchType, TaskStatus } from '../../core/entities/batch';

describe('batch processing use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates queued index tasks and adds them to the index processor', async () => {
    const sourceRepository = { getBatch: jest.fn().mockResolvedValue({ name: 'source-1', items: ['a.pdf', 'b.pdf'] }) };
    const batchRepository = {
      createBatch: jest.fn().mockResolvedValue(undefined),
      setBatchStatus: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new IndexProcessingUseCase(batchRepository as never, sourceRepository as never, {} as never);

    await useCase.execute({ type: BatchType.Index, batch: 'source-1' });

    expect(sourceRepository.getBatch).toHaveBeenCalledWith('index-in', 'source-1');
    const batch = batchRepository.createBatch.mock.calls[0][0];
    expect(batch.detail).toEqual({ name: 'source-1', type: BatchType.Index });
    expect(batch.status).toBe(BatchStatus.None);
    expect(batch.items).toEqual([
      expect.objectContaining({ name: 'a.pdf', status: TaskStatus.Queued, sessionId: null, batch: batch.detail }),
      expect.objectContaining({ name: 'b.pdf', status: TaskStatus.Queued, sessionId: null, batch: batch.detail }),
    ]);
    expect(batch.items[0].id).toMatch(/_00001$/);
    expect(batch.items[1].id).toMatch(/_00002$/);
    expect(batchRepository.setBatchStatus).toHaveBeenCalledWith(batch.detail, BatchStatus.Pending);
    expect(indexProcessor.addTasks).toHaveBeenCalledWith(batch.items);
  });

  it('rejects an index batch that is not present in the source repository', async () => {
    const sourceRepository = { getBatch: jest.fn().mockResolvedValue(undefined) };
    const batchRepository = { createBatch: jest.fn(), setBatchStatus: jest.fn() };
    const useCase = new IndexProcessingUseCase(batchRepository as never, sourceRepository as never, {} as never);

    await expect(useCase.execute({ type: BatchType.Index, batch: 'missing' }))
      .rejects.toThrow('Batch missing not found in index-in');
    expect(batchRepository.createBatch).not.toHaveBeenCalled();
    expect(indexProcessor.addTasks).not.toHaveBeenCalled();
  });

  it('creates queued redact tasks and adds them to the redact processor', async () => {
    const sourceRepository = { getBatch: jest.fn().mockResolvedValue({ name: 'source-2', items: ['c.pdf'] }) };
    const batchRepository = {
      createBatch: jest.fn().mockResolvedValue(undefined),
      setBatchStatus: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new RedactProcessingUseCase(batchRepository as never, sourceRepository as never);

    await useCase.execute({ type: BatchType.Redact, batch: 'source-2' });

    expect(sourceRepository.getBatch).toHaveBeenCalledWith('redact-in', 'source-2');
    const batch = batchRepository.createBatch.mock.calls[0][0];
    expect(batch.detail).toEqual({ name: 'source-2', type: BatchType.Redact });
    expect(batch.items).toEqual([
      expect.objectContaining({ name: 'c.pdf', status: TaskStatus.Queued, sessionId: null, batch: batch.detail }),
    ]);
    expect(batchRepository.setBatchStatus).toHaveBeenCalledWith(batch.detail, BatchStatus.Pending);
    expect(redactProcessor.addTasks).toHaveBeenCalledWith(batch.items);
  });

  it('rejects a redact batch that is not present in the source repository', async () => {
    const sourceRepository = { getBatch: jest.fn().mockResolvedValue(undefined) };
    const batchRepository = { createBatch: jest.fn(), setBatchStatus: jest.fn() };
    const useCase = new RedactProcessingUseCase(batchRepository as never, sourceRepository as never);

    await expect(useCase.execute({ type: BatchType.Redact, batch: 'missing' }))
      .rejects.toThrow('Batch missing not found in redact-in');
    expect(batchRepository.createBatch).not.toHaveBeenCalled();
    expect(redactProcessor.addTasks).not.toHaveBeenCalled();
  });
});