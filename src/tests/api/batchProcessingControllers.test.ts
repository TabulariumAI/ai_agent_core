import 'reflect-metadata';

jest.mock('../../application/useCases/indexProcessingUseCase', () => ({
  IndexProcessingUseCase: class IndexProcessingUseCase {},
}));
jest.mock('../../application/useCases/redactProcessingUseCase', () => ({
  RedactProcessingUseCase: class RedactProcessingUseCase {},
}));

import { IndexBatchProcessingController } from '../../api/controllers/indexBatchProcessingController';
import { RedactBatchProcessingController } from '../../api/controllers/redactBatchProcessingController';
import { BatchType } from '../../core/entities/batch';

const request = {} as never;
const response = {} as never;

describe('batch processing controllers', () => {
  it('starts an index batch with the index batch type', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const helper = { withErrorHandling: jest.fn(async (action: () => Promise<unknown>) => action()) };
    const controller = new IndexBatchProcessingController(helper as never, { execute } as never);

    await expect(controller.indexBatch(request, response, 'batch-1')).resolves.toEqual({});

    expect(execute).toHaveBeenCalledWith({ type: BatchType.Index, batch: 'batch-1' });
  });

  it('starts a redact batch with the redact batch type', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const helper = { withErrorHandling: jest.fn(async (action: () => Promise<unknown>) => action()) };
    const controller = new RedactBatchProcessingController(helper as never, { execute } as never);

    await expect(controller.redactBatch(request, response, 'batch-2')).resolves.toEqual({});

    expect(execute).toHaveBeenCalledWith({ type: BatchType.Redact, batch: 'batch-2' });
  });
});