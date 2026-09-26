import 'reflect-metadata';

import { AutoRecordCallbackCalcUseCase } from '../../application/useCases/autoRecordCallbackCalcUseCase';
import { AutoRecordCallbackEndorseUseCase } from '../../application/useCases/autoRecordCallbackEndorseUseCase';
import { AutoRecordCallbackIndexUseCase } from '../../application/useCases/autoRecordCallbackIndexUseCase';
import { AutoRedactCallbackIndexUseCase } from '../../application/useCases/autoRedactCallbackIndexUseCase';
import { AutoRedactCallbackRedactUseCase } from '../../application/useCases/autoRedactCallbackRedactUseCase';
import { ProvisionCallbackIndexUseCase } from '../../application/useCases/provisionCallbackIndexUseCase';
import { CallbackStatus, SessionCallbackData } from '../../core/entities/imports';

const sessionData = new SessionCallbackData('session-1');

const fixtures = [
  {
    name: 'auto-record calc',
    create: () => {
      const recordClient = { endorseDocument: jest.fn().mockResolvedValue(undefined) };
      const integrationService = { record: jest.fn().mockResolvedValue('updated metadata') };
      const trackingService = { trackSuccess: jest.fn().mockResolvedValue(undefined), trackError: jest.fn().mockResolvedValue(undefined) };
      const blobService = { downloadString: jest.fn().mockResolvedValue('metadata') };
      const useCase = new AutoRecordCallbackCalcUseCase(recordClient as never, integrationService as never, trackingService as never, blobService as never);
      return { useCase, collaborators: [recordClient, integrationService, trackingService, blobService] };
    },
  },
  {
    name: 'auto-record endorse',
    create: () => {
      const integrationService = { processAutoRecord: jest.fn().mockResolvedValue(undefined) };
      const trackingService = { trackSuccess: jest.fn().mockResolvedValue(undefined), trackError: jest.fn().mockResolvedValue(undefined) };
      const blobService = { downloadContent: jest.fn().mockResolvedValue({ documentType: 'pdf', data: Buffer.from('doc') }) };
      const useCase = new AutoRecordCallbackEndorseUseCase(integrationService as never, trackingService as never, blobService as never);
      return { useCase, collaborators: [integrationService, trackingService, blobService] };
    },
  },
  {
    name: 'auto-record index',
    create: () => {
      const computeClient = { calcDocument: jest.fn().mockResolvedValue(undefined) };
      const trackingService = { trackSuccess: jest.fn().mockResolvedValue(undefined), trackError: jest.fn().mockResolvedValue(undefined) };
      const useCase = new AutoRecordCallbackIndexUseCase(computeClient as never, trackingService as never);
      return { useCase, collaborators: [computeClient, trackingService] };
    },
  },
  {
    name: 'auto-redact index',
    create: () => {
      const redactClient = { redactDocument: jest.fn().mockResolvedValue(undefined) };
      const trackingService = { trackSuccess: jest.fn().mockResolvedValue(undefined), trackError: jest.fn().mockResolvedValue(undefined) };
      const useCase = new AutoRedactCallbackIndexUseCase(redactClient as never, trackingService as never);
      return { useCase, collaborators: [redactClient, trackingService] };
    },
  },
  {
    name: 'auto-redact redact',
    create: () => {
      const integrationService = { processAutoRedact: jest.fn().mockResolvedValue(undefined) };
      const trackingService = { trackSuccess: jest.fn().mockResolvedValue(undefined), trackError: jest.fn().mockResolvedValue(undefined) };
      const blobService = { downloadContent: jest.fn().mockResolvedValue({ documentType: 'pdf', data: Buffer.from('doc') }) };
      const useCase = new AutoRedactCallbackRedactUseCase(integrationService as never, trackingService as never, blobService as never);
      return { useCase, collaborators: [integrationService, trackingService, blobService] };
    },
  },
  {
    name: 'provision index',
    create: () => {
      const computeClient = { calcDocument: jest.fn().mockResolvedValue(undefined) };
      const trackingService = { trackSuccess: jest.fn().mockResolvedValue(undefined), trackError: jest.fn().mockResolvedValue(undefined) };
      const useCase = new ProvisionCallbackIndexUseCase(computeClient as never, trackingService as never);
      return { useCase, collaborators: [computeClient, trackingService] };
    },
  },
];

describe.each(fixtures)('$name callback use case', ({ create }) => {
  it('does not advance a callback that is still processing', async () => {
    const { useCase, collaborators } = create();

    await useCase.execute({ sessionData, callbackData: { status: CallbackStatus.PROCESSING, data: 'pending' } } as never);

    for (const collaborator of collaborators) {
      for (const method of Object.values(collaborator)) {
        expect(method).not.toHaveBeenCalled();
      }
    }
  });

  it('handles a completed callback', async () => {
    const { useCase, collaborators } = create();

    await useCase.execute({
      sessionData,
      callbackData: { status: CallbackStatus.COMPLETED, data: 'https://blob.test/document', types: 'pdf' },
    } as never);

    expect(collaborators.some((collaborator) => Object.values(collaborator).some((method) => method.mock.calls.length > 0)))
      .toBe(true);
  });

  it('tracks callback errors and does not run the next success step', async () => {
    const { useCase, collaborators } = create();

    await useCase.execute({
      sessionData,
      callbackData: { status: CallbackStatus.ERROR, data: 'upstream failure' },
    } as never);

    const trackingService = collaborators.find((collaborator) => 'trackError' in collaborator);
    expect(trackingService?.trackError).toHaveBeenCalledWith(
      expect.any(Object),
      sessionData.id,
      expect.stringContaining('upstream failure'),
    );
  });
});

describe.each([
  {
    name: 'auto-record endorse',
    UseCase: AutoRecordCallbackEndorseUseCase,
    integrationMethod: 'processAutoRecord',
  },
  {
    name: 'auto-redact redact',
    UseCase: AutoRedactCallbackRedactUseCase,
    integrationMethod: 'processAutoRedact',
  },
])('$name content callback error paths', ({ UseCase, integrationMethod }) => {
  function setup() {
    const integrationService = { [integrationMethod]: jest.fn().mockResolvedValue(undefined) };
    const trackingService = {
      trackSuccess: jest.fn().mockResolvedValue(undefined),
      trackError: jest.fn().mockResolvedValue(undefined),
    };
    const blobService = { downloadContent: jest.fn().mockResolvedValue({ documentType: 'pdf', data: Buffer.from('doc') }) };
    const useCase = new UseCase(integrationService as never, trackingService as never, blobService as never);
    return { useCase, integrationService, trackingService, blobService };
  }

  it('reports a missing content type without downloading', async () => {
    const fixture = setup();

    await fixture.useCase.execute({
      sessionData,
      callbackData: { status: CallbackStatus.COMPLETED, data: 'https://blob.test/document' },
    } as never);

    expect(fixture.blobService.downloadContent).not.toHaveBeenCalled();
    expect(fixture.trackingService.trackError).toHaveBeenCalledWith(expect.any(Object), sessionData.id, 'Callback data type is missing');
    expect(fixture.integrationService[integrationMethod]).toHaveBeenCalledWith(sessionData, { error: 'Callback data type is missing' });
  });

  it('reports blob download failures to tracking and integration', async () => {
    const fixture = setup();
    fixture.blobService.downloadContent.mockRejectedValue(new Error('blob unavailable'));

    await fixture.useCase.execute({
      sessionData,
      callbackData: { status: CallbackStatus.COMPLETED, data: 'https://blob.test/document', types: 'pdf' },
    } as never);

    expect(fixture.trackingService.trackError).toHaveBeenCalledWith(
      expect.any(Object), sessionData.id, 'Error downloading blob: https://blob.test/document',
    );
    expect(fixture.integrationService[integrationMethod]).toHaveBeenCalledWith(sessionData, { error: 'blob unavailable' });
  });

  it('reports integration processing failures and does not mark success', async () => {
    const fixture = setup();
    fixture.integrationService[integrationMethod]
      .mockRejectedValueOnce(new Error('integration failed'))
      .mockResolvedValueOnce(undefined);

    await fixture.useCase.execute({
      sessionData,
      callbackData: { status: CallbackStatus.COMPLETED, data: 'https://blob.test/document', types: 'pdf' },
    } as never);

    expect(fixture.trackingService.trackError).toHaveBeenCalledWith(
      expect.any(Object), sessionData.id, expect.stringContaining('integration failed'),
    );
    expect(fixture.integrationService[integrationMethod]).toHaveBeenLastCalledWith(
      sessionData, { error: 'integration failed' },
    );
    expect(fixture.trackingService.trackSuccess).not.toHaveBeenCalled();
  });
});

describe.each([
  {
    name: 'auto-record index',
    UseCase: AutoRecordCallbackIndexUseCase,
    clientMethod: 'calcDocument',
  },
  {
    name: 'auto-redact index',
    UseCase: AutoRedactCallbackIndexUseCase,
    clientMethod: 'redactDocument',
  },
  {
    name: 'provision index',
    UseCase: ProvisionCallbackIndexUseCase,
    clientMethod: 'calcDocument',
  },
])('$name next-step failure', ({ UseCase, clientMethod }) => {
  it('tracks next-step client errors without rejecting the callback', async () => {
    const client = { [clientMethod]: jest.fn().mockRejectedValue('client unavailable') };
    const trackingService = {
      trackSuccess: jest.fn().mockResolvedValue(undefined),
      trackError: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new UseCase(client as never, trackingService as never);

    await expect(useCase.execute({
      sessionData,
      callbackData: { status: CallbackStatus.COMPLETED, data: 'done' },
    } as never)).resolves.toBeUndefined();

    expect(trackingService.trackError).toHaveBeenCalledWith(expect.any(Object), sessionData.id, 'client unavailable');
  });

  it('uses the message from Error instances for next-step failures', async () => {
    const client = { [clientMethod]: jest.fn().mockRejectedValue(new Error('client error')) };
    const trackingService = {
      trackSuccess: jest.fn().mockResolvedValue(undefined),
      trackError: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new UseCase(client as never, trackingService as never);

    await useCase.execute({
      sessionData,
      callbackData: { status: CallbackStatus.COMPLETED, data: 'done' },
    } as never);

    expect(trackingService.trackError).toHaveBeenCalledWith(expect.any(Object), sessionData.id, 'client error');
  });
});

it('stringifies non-Error failures after auto-record calculation', async () => {
  const recordClient = { endorseDocument: jest.fn().mockRejectedValue('endorse unavailable') };
  const integrationService = { record: jest.fn().mockResolvedValue('recorded metadata') };
  const trackingService = {
    trackSuccess: jest.fn().mockResolvedValue(undefined),
    trackError: jest.fn().mockResolvedValue(undefined),
  };
  const blobService = { downloadString: jest.fn().mockResolvedValue('metadata') };
  const useCase = new AutoRecordCallbackCalcUseCase(
    recordClient as never, integrationService as never, trackingService as never, blobService as never,
  );

  await useCase.execute({
    sessionData,
    callbackData: { status: CallbackStatus.COMPLETED, data: 'https://blob.test/metadata' },
  });

  expect(trackingService.trackError).toHaveBeenCalledWith(expect.any(Object), sessionData.id, 'endorse unavailable');
});

it('tracks record-client failure after auto-record calculation', async () => {
  const recordClient = { endorseDocument: jest.fn().mockRejectedValue(new Error('endorse unavailable')) };
  const integrationService = { record: jest.fn().mockResolvedValue('recorded metadata') };
  const trackingService = {
    trackSuccess: jest.fn().mockResolvedValue(undefined),
    trackError: jest.fn().mockResolvedValue(undefined),
  };
  const blobService = { downloadString: jest.fn().mockResolvedValue('metadata') };
  const useCase = new AutoRecordCallbackCalcUseCase(
    recordClient as never, integrationService as never, trackingService as never, blobService as never,
  );

  await expect(useCase.execute({
    sessionData,
    callbackData: { status: CallbackStatus.COMPLETED, data: 'https://blob.test/metadata' },
  })).resolves.toBeUndefined();

  expect(trackingService.trackError).toHaveBeenCalledWith(expect.any(Object), sessionData.id, 'endorse unavailable');
});