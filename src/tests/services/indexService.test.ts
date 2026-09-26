import 'reflect-metadata';
import { Readable } from 'stream';

import { IndexService } from '../../infrastructure/services/indexService';
import { Callback, InternalError, SessionCallbackData, Step } from '../../core/entities/imports';
import { IBlobService } from '../../core/interfaces/blobService';
import { IIndexClient } from '../../core/interfaces/indexClient';
import { ISessionClient } from '../../core/interfaces/sessionClient';
import { ITrackingService } from '../../core/interfaces/trackingService';

describe('IndexService', () => {
  let blobService: { upload: jest.Mock };
  let indexClient: { indexDocument: jest.Mock };
  let sessionClient: { createSession: jest.Mock; getSession: jest.Mock };
  let trackingService: { trackSuccess: jest.Mock; trackError: jest.Mock };
  let service: IndexService;

  beforeEach(() => {
    blobService = { upload: jest.fn().mockResolvedValue(undefined) };
    indexClient = { indexDocument: jest.fn().mockResolvedValue(undefined) };
    sessionClient = {
      createSession: jest.fn().mockResolvedValue('session-1'),
      getSession: jest.fn().mockResolvedValue({ baseUrl: 'https://blob.test', token: 'sas=token' }),
    };
    trackingService = {
      trackSuccess: jest.fn().mockResolvedValue(undefined),
      trackError: jest.fn().mockResolvedValue(undefined),
    };
    service = new IndexService(
      blobService as unknown as IBlobService,
      sessionClient as unknown as ISessionClient,
      indexClient as unknown as IIndexClient,
      trackingService as unknown as ITrackingService,
    );
  });

  it('creates a session, uploads the document, and requests indexing', async () => {
    const context = { workflow: 'index', step: 'index' };
    const stream = Readable.from(['document']);
    const choice = [{ service: 'Indexing', level: 1 }];
    const taskData = { id: 'task-1', batch: 'batch-1' };

    await expect(service.index(context, 'pdf', stream, choice, Callback.INDEX, taskData))
      .resolves.toBe('session-1');

    expect(sessionClient.createSession).toHaveBeenCalledWith(context, 'pdf');
    expect(sessionClient.getSession).toHaveBeenCalledWith(context, 'session-1');
    expect(blobService.upload).toHaveBeenCalledWith('https://blob.test/session-1.pdf?sas=token', stream);
    expect(indexClient.indexDocument).toHaveBeenCalledWith(
      context,
      new SessionCallbackData('session-1', taskData),
      'session-1.pdf',
      choice,
      Callback.INDEX,
    );
    expect(trackingService.trackSuccess).toHaveBeenCalledTimes(2);
  });

  it('tracks and wraps session creation errors', async () => {
    sessionClient.createSession.mockRejectedValue(new Error('upstream unavailable'));
    const context = { workflow: 'index', step: 'index' };

    await expect(service.index(context, 'pdf', Readable.from([]), [], Callback.INDEX))
      .rejects.toEqual(new InternalError('Failed to create session'));
    expect(trackingService.trackError).toHaveBeenCalledWith(
      { workflow: 'index', step: Step.SESSION },
      '',
      'Failed to create session',
    );
  });

  it('tracks and wraps upload errors', async () => {
    blobService.upload.mockRejectedValue(new Error('storage unavailable'));
    const context = { workflow: 'index', step: 'index' };

    await expect(service.index(context, 'pdf', Readable.from([]), [], Callback.INDEX))
      .rejects.toEqual(new InternalError('Failed to upload document'));
    expect(trackingService.trackError).toHaveBeenCalledWith(
      { workflow: 'index', step: Step.UPLOAD },
      'session-1',
      'Failed to upload document',
    );
  });

  it('tracks and wraps indexing errors', async () => {
    indexClient.indexDocument.mockRejectedValue(new Error('index unavailable'));
    const context = { workflow: 'index', step: 'index' };

    await expect(service.index(context, 'pdf', Readable.from([]), [], Callback.INDEX))
      .rejects.toEqual(new InternalError('Failed to index document'));
    expect(trackingService.trackError).toHaveBeenCalledWith(
      { workflow: 'index', step: Step.INDEX },
      'session-1',
      'Failed to index document',
    );
  });
});