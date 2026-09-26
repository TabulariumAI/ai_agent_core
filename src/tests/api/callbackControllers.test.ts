import 'reflect-metadata';

import { AutoRecordCallbackController } from '../../api/controllers/autoRecordCallbackController';
import { AutoRedactCallbackController } from '../../api/controllers/autoRedactCallbackController';
import { CalcCallbackController } from '../../api/controllers/calcCallbackController';
import { EndorseCallbackController } from '../../api/controllers/endorseCallbackController';
import { IndexCallbackController } from '../../api/controllers/indexCallbackController';
import { ProvisionCallbackController } from '../../api/controllers/provisionCallbackController';
import { RedactCallbackController } from '../../api/controllers/redactCallbackController';
import { ReprocessCallbackController } from '../../api/controllers/reprocessCallbackController';
import { Callback, CallbackStatus, SessionCallbackData } from '../../core/entities/imports';
import { SessionQueryParams } from '../../api/utils/sessionQueryParam';

type ControllerUseCase = { execute: jest.Mock };
type CallbackTest = {
  name: string;
  callback: string;
  run: (helper: never, useCase: ControllerUseCase, params: SessionQueryParams, body: { status: CallbackStatus; data: string }) => Promise<unknown>;
};

const noopRequest = {} as never;
const noopResponse = {} as never;

const callbackTests: CallbackTest[] = [
  {
    name: 'index', callback: Callback.INDEX,
    run: (helper, useCase, params, body) => new IndexCallbackController(helper, useCase as never).index(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'calc', callback: Callback.CALC,
    run: (helper, useCase, params, body) => new CalcCallbackController(helper, useCase as never).calc(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'endorse', callback: Callback.ENDORSE,
    run: (helper, useCase, params, body) => new EndorseCallbackController(helper, useCase as never).endorse(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'redact', callback: Callback.REDACT,
    run: (helper, useCase, params, body) => new RedactCallbackController(helper, useCase as never).index(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'reprocess', callback: Callback.REPROCESS,
    run: (helper, useCase, params, body) => new ReprocessCallbackController(helper, useCase as never).index(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'provision index', callback: Callback.PROVISION_INDEX,
    run: (helper, useCase, params, body) => new ProvisionCallbackController(helper, useCase as never, { execute: jest.fn() } as never).provisionIndex(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'provision calc', callback: Callback.PROVISION_CALC,
    run: (helper, useCase, params, body) => new ProvisionCallbackController(helper, { execute: jest.fn() } as never, useCase as never).provisionCalc(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'auto-record index', callback: Callback.AUTORECORD_INDEX,
    run: (helper, useCase, params, body) => new AutoRecordCallbackController(helper, useCase as never, { execute: jest.fn() } as never, { execute: jest.fn() } as never).autoRecordIndex(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'auto-record calc', callback: Callback.AUTORECORD_CALC,
    run: (helper, useCase, params, body) => new AutoRecordCallbackController(helper, { execute: jest.fn() } as never, useCase as never, { execute: jest.fn() } as never).autoRecordCalc(noopRequest, noopResponse, 'token', params, body),
  },
  {
    name: 'auto-record endorse', callback: Callback.AUTORECORD_ENDORSE,
    run: (helper, useCase, params, body) => new AutoRecordCallbackController(helper, { execute: jest.fn() } as never, { execute: jest.fn() } as never, useCase as never).autoRecordEndorse(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'auto-redact index', callback: Callback.AUTOREDACT_INDEX,
    run: (helper, useCase, params, body) => new AutoRedactCallbackController(helper, { execute: jest.fn() } as never, useCase as never).autoRedactIndex(noopRequest, noopResponse, params, 'token', body),
  },
  {
    name: 'auto-redact redact', callback: Callback.AUTOREDACT_REDACT,
    run: (helper, useCase, params, body) => new AutoRedactCallbackController(helper, useCase as never, { execute: jest.fn() } as never).autoRedactRedact(noopRequest, noopResponse, params, 'token', body),
  },
];

describe.each(callbackTests)('$name callback controller', ({ callback, run }) => {
  it('validates and delegates the completed callback using session and task query values', async () => {
    let receivedTokenData = '';
    let receivedToken = '';
    let receivedCallback: unknown;
    const helper = {
      withCallbackErrorHandling: jest.fn(async (
        tokenData: string,
        token: string,
        callbackData: unknown,
        action: () => Promise<void>,
      ) => {
        receivedTokenData = tokenData;
        receivedToken = token;
        receivedCallback = callbackData;
        await action();
        return 'handled';
      }),
    };
    const useCase = { execute: jest.fn().mockResolvedValue(undefined) };
    const params = Object.assign(new SessionQueryParams(), {
      session: 'session-1',
      batch: 'batch-1',
      task: 'task-1',
    });
    const callbackData = { status: CallbackStatus.COMPLETED, data: 'https://blob.test/result' };

    await expect(run(helper as never, useCase, params, callbackData)).resolves.toBe('handled');

    expect(receivedTokenData).toBe(`${callback}?sn=session-1&bt=batch-1&tk=task-1`);
    expect(receivedToken).toBe('token');
    expect(receivedCallback).toBe(callbackData);
    expect(useCase.execute).toHaveBeenCalledWith({
      sessionData: new SessionCallbackData('session-1', { batch: 'batch-1', id: 'task-1' }),
      callbackData,
    });
  });
});