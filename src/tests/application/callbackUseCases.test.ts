import 'reflect-metadata';

import { CalcCallbackUseCase } from '../../application/useCases/calcCallbackUseCase';
import { EndorseCallbackUseCase } from '../../application/useCases/endorseCallbackUseCase';
import { IndexCallbackUseCase } from '../../application/useCases/indexCallbackUseCase';
import { ProvisionCallbackCalcUseCase } from '../../application/useCases/provisionCallbackCalcUseCase';
import { RedactCallbackUseCase } from '../../application/useCases/redactCallbackUseCase';
import { ReprocessCallbackUseCase } from '../../application/useCases/reprocessCallbackUseCase';
import { CallbackStatus, SessionCallbackData } from '../../core/entities/imports';

type CallbackUseCase = new (...dependencies: never[]) => { execute(data: never): Promise<void> };

const callbackCases: Array<{
  name: string;
  UseCase: CallbackUseCase;
  integrationMethod: string;
  downloadMethod: 'downloadString' | 'downloadContent';
  requiresType: boolean;
}> = [
  { name: 'calc', UseCase: CalcCallbackUseCase, integrationMethod: 'processCalc', downloadMethod: 'downloadString', requiresType: false },
  { name: 'endorse', UseCase: EndorseCallbackUseCase, integrationMethod: 'processEndorse', downloadMethod: 'downloadContent', requiresType: true },
  { name: 'index', UseCase: IndexCallbackUseCase, integrationMethod: 'processIndex', downloadMethod: 'downloadString', requiresType: false },
  { name: 'provision calc', UseCase: ProvisionCallbackCalcUseCase, integrationMethod: 'processProvision', downloadMethod: 'downloadString', requiresType: false },
  { name: 'redact', UseCase: RedactCallbackUseCase, integrationMethod: 'processRedact', downloadMethod: 'downloadContent', requiresType: true },
  { name: 'reprocess', UseCase: ReprocessCallbackUseCase, integrationMethod: 'processRefine', downloadMethod: 'downloadString', requiresType: false },
];

describe.each(callbackCases)('$name callback use case', ({ UseCase, integrationMethod, downloadMethod, requiresType }) => {
  function createFixture() {
    const integrationService = { [integrationMethod]: jest.fn().mockResolvedValue(undefined) };
    const trackingService = {
      trackSuccess: jest.fn().mockResolvedValue(undefined),
      trackError: jest.fn().mockResolvedValue(undefined),
    };
    const blobService = {
      downloadString: jest.fn().mockResolvedValue('metadata'),
      downloadContent: jest.fn().mockResolvedValue({ documentType: 'pdf', data: Buffer.from('document') }),
    };
    const useCase = new UseCase(
      integrationService as never,
      trackingService as never,
      blobService as never,
    );
    const sessionData = new SessionCallbackData('session-1');
    const callbackData = {
      status: CallbackStatus.COMPLETED,
      data: 'https://blob.test/result',
      ...(requiresType ? { types: 'pdf' } : {}),
    };
    return { useCase, integrationService, trackingService, blobService, sessionData, callbackData };
  }

  it('processes completed callbacks and tracks success', async () => {
    const fixture = createFixture();

    await fixture.useCase.execute({ sessionData: fixture.sessionData, callbackData: fixture.callbackData } as never);

    expect(fixture.blobService[downloadMethod]).toHaveBeenCalledWith(
      fixture.callbackData.data,
      ...(downloadMethod === 'downloadContent' ? ['pdf'] : []),
    );
    expect(fixture.integrationService[integrationMethod]).toHaveBeenCalledWith(
      fixture.sessionData,
      downloadMethod === 'downloadString'
        ? { metaData: 'metadata' }
        : { content: { documentType: 'pdf', data: Buffer.from('document') } },
    );
    expect(fixture.trackingService.trackSuccess).toHaveBeenCalledWith(expect.any(Object), 'session-1');
  });

  it('reports callback errors and skips blob access', async () => {
    const fixture = createFixture();
    const errorData = { status: CallbackStatus.ERROR, data: 'upstream error' };

    await fixture.useCase.execute({ sessionData: fixture.sessionData, callbackData: errorData } as never);

    expect(fixture.trackingService.trackError).toHaveBeenCalledWith(
      expect.any(Object),
      'session-1',
      expect.stringContaining('upstream error'),
    );
    expect(fixture.blobService[downloadMethod]).not.toHaveBeenCalled();
  });

  it('reports missing output types for content callbacks without downloading', async () => {
    if (!requiresType) return;
    const fixture = createFixture();

    await fixture.useCase.execute({
      sessionData: fixture.sessionData,
      callbackData: { status: CallbackStatus.COMPLETED, data: fixture.callbackData.data },
    } as never);

    expect(fixture.blobService.downloadContent).not.toHaveBeenCalled();
    expect(fixture.integrationService[integrationMethod]).toHaveBeenCalledWith(
      fixture.sessionData,
      { error: 'Callback data type is missing' },
    );
    expect(fixture.trackingService.trackError).toHaveBeenCalledWith(
      expect.any(Object), fixture.sessionData.id, 'Callback data type is missing',
    );
  });

  it('ignores callbacks that are still processing', async () => {
    const fixture = createFixture();

    await fixture.useCase.execute({
      sessionData: fixture.sessionData,
      callbackData: { status: CallbackStatus.PROCESSING, data: 'pending' },
    } as never);

    expect(fixture.blobService[downloadMethod]).not.toHaveBeenCalled();
    expect(fixture.trackingService.trackSuccess).not.toHaveBeenCalled();
    expect(fixture.trackingService.trackError).not.toHaveBeenCalled();
  });

  it('reports blob download failures to tracking and integration', async () => {
    const fixture = createFixture();
    fixture.blobService[downloadMethod].mockRejectedValue(new Error('blob unavailable'));

    await fixture.useCase.execute({ sessionData: fixture.sessionData, callbackData: fixture.callbackData } as never);

    expect(fixture.trackingService.trackError).toHaveBeenCalled();
    expect(fixture.integrationService[integrationMethod]).toHaveBeenCalledWith(
      fixture.sessionData,
      { error: 'blob unavailable' },
    );
    expect(fixture.trackingService.trackSuccess).not.toHaveBeenCalled();
  });

  it('reports integration failures and sends an error context', async () => {
    const fixture = createFixture();
    fixture.integrationService[integrationMethod]
      .mockRejectedValueOnce(new Error('integration failed'))
      .mockResolvedValueOnce(undefined);

    await fixture.useCase.execute({ sessionData: fixture.sessionData, callbackData: fixture.callbackData } as never);

    expect(fixture.trackingService.trackError).toHaveBeenCalledWith(
      expect.any(Object),
      'session-1',
      expect.stringContaining('integration failed'),
    );
    expect(fixture.integrationService[integrationMethod]).toHaveBeenLastCalledWith(
      fixture.sessionData,
      { error: 'integration failed' },
    );
    expect(fixture.trackingService.trackSuccess).not.toHaveBeenCalled();
  });
});