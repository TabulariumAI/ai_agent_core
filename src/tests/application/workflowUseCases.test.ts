import 'reflect-metadata';
import { Readable } from 'stream';

import { AutoRecordUseCase } from '../../application/useCases/autoRecordUseCase';
import { AutoRedactUseCase } from '../../application/useCases/autoRedactUseCase';
import { EndorseUseCase } from '../../application/useCases/endorseUseCase';
import { ProvisionUseCase } from '../../application/useCases/provisionUseCase';
import { RedactUseCase } from '../../application/useCases/redactUseCase';
import { Callback, SessionCallbackData, Step, Workflow } from '../../core/entities/imports';
import { IRecordClient } from '../../core/interfaces/recordClient';
import { IRedactClient } from '../../core/interfaces/redactClient';
import { IndexService } from '../../infrastructure/services/indexService';
import { IBlobService } from '../../core/interfaces/blobService';
import { ITrackingService } from '../../core/interfaces/trackingService';
import { ISessionClient } from '../../core/interfaces/sessionClient';

describe('workflow use cases', () => {
  it('indexes an auto-record document exactly once', async () => {
    const index = jest.fn().mockResolvedValue('session-1');
    const stream = Readable.from(['record']);
    const useCase = new AutoRecordUseCase(
      {} as IBlobService,
      {} as ITrackingService,
      {} as ISessionClient,
      { index } as unknown as IndexService,
    );

    await expect(useCase.execute({ documentType: 'pdf', stream })).resolves.toBe('session-1');
    expect(index).toHaveBeenCalledTimes(1);
    expect(index).toHaveBeenCalledWith(
      { workflow: Workflow.AUTORECORD, step: Step.INDEX },
      'pdf',
      stream,
      expect.any(Array),
      Callback.AUTORECORD_INDEX,
    );
  });

  it('indexes an auto-redact document with its task data', async () => {
    const index = jest.fn().mockResolvedValue('session-2');
    const stream = Readable.from(['redact']);
    const taskData = { id: 'task-1', batch: 'batch-1' };
    const useCase = new AutoRedactUseCase(
      {} as IBlobService,
      {} as ITrackingService,
      { index } as unknown as IndexService,
    );

    await expect(useCase.execute({ documentType: 'tiff', stream, taskData })).resolves.toBe('session-2');
    expect(index).toHaveBeenCalledWith(
      { workflow: Workflow.AUTOREDACT, step: Step.INDEX },
      'tiff',
      stream,
      expect.any(Array),
      Callback.AUTOREDACT_INDEX,
      taskData,
    );
  });

  it('indexes a provision document with its task callback data', async () => {
    const index = jest.fn().mockResolvedValue('session-3');
    const stream = Readable.from(['provision']);
    const taskCallbackData = { id: 'task-2', batch: 'batch-2' };
    const useCase = new ProvisionUseCase({ index } as unknown as IndexService);

    await expect(useCase.execute({ documentType: 'pdf', stream, taskCallbackData })).resolves.toBe('session-3');
    expect(index).toHaveBeenCalledWith(
      { workflow: Workflow.PROVISION, step: Step.INDEX },
      'pdf',
      stream,
      expect.any(Array),
      Callback.PROVISION_INDEX,
      taskCallbackData,
    );
  });

  it('forwards endorsement requests to the record client', async () => {
    const endorseDocument = jest.fn().mockResolvedValue(undefined);
    const sessionData = new SessionCallbackData('session-4');
    const useCase = new EndorseUseCase({ endorseDocument } as unknown as IRecordClient);

    await useCase.execute({ sessionData, metaData: 'metadata' });

    expect(endorseDocument).toHaveBeenCalledWith(
      { workflow: Workflow.ENDORSE, step: Step.ENDORSE },
      sessionData,
      'metadata',
      Callback.ENDORSE,
    );
  });

  it('forwards redaction requests to the redact client', async () => {
    const redactDocument = jest.fn().mockResolvedValue(undefined);
    const sessionData = new SessionCallbackData('session-5');
    const useCase = new RedactUseCase({ redactDocument } as unknown as IRedactClient);

    await useCase.execute({ sessionData, metaData: null });

    expect(redactDocument).toHaveBeenCalledWith(
      { workflow: Workflow.REDACT, step: Step.REDACT },
      sessionData,
      null,
      Callback.REDACT,
    );
  });
});