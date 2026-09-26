import 'reflect-metadata';

import { CalcUseCase } from '../../application/useCases/calcUseCase';
import { IndexUseCase } from '../../application/useCases/indexUseCase';
import { ReprocessUseCase } from '../../application/useCases/reprocessUseCase';
import { Callback, SessionCallbackData, Step, Workflow } from '../../core/entities/imports';
import { IComputeClient } from '../../core/interfaces/computeClient';
import { IReprocessClient } from '../../core/interfaces/reprocessClient';
import { IndexService } from '../../infrastructure/services/indexService';
import { IBlobService } from '../../core/interfaces/blobService';
import { ITrackingService } from '../../core/interfaces/trackingService';
import { Readable } from 'stream';

describe('application use cases', () => {
  it('forwards calculation requests with the CALC workflow context', async () => {
    const computeClient = { calcDocument: jest.fn().mockResolvedValue(undefined) } as unknown as IComputeClient;
    const useCase = new CalcUseCase(computeClient);
    const sessionData = new SessionCallbackData('session-1');

    await useCase.execute({ sessionData, metaData: '{"heading":{}}' });

    expect(computeClient.calcDocument).toHaveBeenCalledWith(
      { workflow: Workflow.CALC, step: Step.CALC },
      sessionData,
      '{"heading":{}}',
      Callback.CALC,
    );
  });

  it('forwards reprocess requests with the REPROCESS workflow context', async () => {
    const reprocessClient = { reprocessDocument: jest.fn().mockResolvedValue(undefined) } as unknown as IReprocessClient;
    const useCase = new ReprocessUseCase(reprocessClient);
    const sessionData = new SessionCallbackData('session-1');

    await useCase.execute({ sessionData, segment: 'party' });

    expect(reprocessClient.reprocessDocument).toHaveBeenCalledWith(
      { workflow: Workflow.REPROCESS, step: Step.REPROCESS },
      sessionData,
      'party',
      Callback.REPROCESS,
    );
  });

  it('returns the session produced by the index service', async () => {
    const index = jest.fn().mockResolvedValue('session-1');
    const indexService = { index } as unknown as IndexService;
    const useCase = new IndexUseCase(
      {} as IBlobService,
      {} as ITrackingService,
      indexService,
    );
    const stream = Readable.from(['document']);

    await expect(useCase.execute({ documentType: 'pdf', stream })).resolves.toBe('session-1');
    expect(index).toHaveBeenCalledWith(
      { workflow: Workflow.INDEX, step: Step.INDEX },
      'pdf',
      stream,
      expect.any(Array),
      Callback.INDEX,
    );
  });
});