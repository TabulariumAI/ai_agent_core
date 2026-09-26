import 'reflect-metadata';

const containerSet = jest.fn();
const containerGet = jest.fn((service: unknown) => ({ service }));

jest.mock('typedi', () => ({
  Container: { set: containerSet, get: containerGet },
  Token: class Token { constructor(public name: string) {} },
}));
jest.mock('../../infrastructure/services/imports', () => ({
  ConsoleLogger: class ConsoleLogger {},
  BatchClient: class BatchClient {},
  TokenService: class TokenService {},
  FileTypeService: class FileTypeService {},
  AzureBlobService: class AzureBlobService {},
  DemoBatchIntegrationService: class DemoBatchIntegrationService {},
  DemoTrackingService: class DemoTrackingService {},
}));
jest.mock('../../infrastructure/repositories/imports', () => ({
  FsBatchRepository: class FsBatchRepository {},
  AzureBatchSourceRepository: class AzureBatchSourceRepository {},
}));
jest.mock('../../infrastructure/aiclients/imports', () => ({
  ComputeClient: class ComputeClient { constructor(public token: unknown) {} },
  SessionClient: class SessionClient { constructor(public token: unknown) {} },
  RedactClient: class RedactClient { constructor(public token: unknown, public fileType: unknown) {} },
  ReprocessClient: class ReprocessClient { constructor(public token: unknown) {} },
  IndexClient: class IndexClient { constructor(public token: unknown) {} },
  RecordClient: class RecordClient { constructor(public token: unknown, public fileType: unknown) {} },
}));
jest.mock('../../application/processors/indexTaskProcessor', () => ({ IndexTaskProcessor: class IndexTaskProcessor {} }));
jest.mock('../../application/processors/redactTaskProcessor', () => ({ RedactTaskProcessor: class RedactTaskProcessor {} }));
jest.mock('../../application/processors/taskProcessor', () => ({ TaskProcessor: class TaskProcessor {} }));

import { setupContainer } from '../../di/container';
import { TOKENS } from '../../core/tokens';

describe('setupContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    containerGet.mockImplementation((service: unknown) => ({ service }));
  });

  it('registers runtime service, client, and processor tokens', () => {
    setupContainer();

    const registeredTokens = containerSet.mock.calls.map(([token]) => token);
    expect(registeredTokens).toEqual(expect.arrayContaining([
      TOKENS.ILogger,
      TOKENS.IBatchRepository,
      TOKENS.IBatchClient,
      TOKENS.IBatchSourceRepository,
      TOKENS.IBlobService,
      TOKENS.IIntegrationService,
      TOKENS.ITrackingService,
      TOKENS.IComputeClient,
      TOKENS.ISessionClient,
      TOKENS.IRedactClient,
      TOKENS.IReprocessClient,
      TOKENS.IIndexClient,
      TOKENS.IRecordClient,
      TOKENS.IndexTaskProcessor,
      TOKENS.RedactTaskProcessor,
    ]));
  });

  it('returns the shared typedi container for subsequent adapter registration', async () => {
    const { Container } = await import('typedi');
    const { Container: exportedContainer } = await import('../../di/container');

    expect(exportedContainer).toBe(Container);
  });
});
