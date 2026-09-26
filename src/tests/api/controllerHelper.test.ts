import 'reflect-metadata';
import { Response } from 'express';

import { ControllerHelper } from '../../api/utils/controllerHelper';
import { AuthorizationError, BadRequestError, InternalError, NotFoundError } from '../../core/entities/error';
import { CallbackStatus } from '../../core/entities/callback';
import { FileTypeService } from '../../infrastructure/services/fileTypeService';
import { ChoiceService } from '../../infrastructure/services/choiceService';
import { TokenService } from '../../infrastructure/services/tokenService';

describe('ControllerHelper', () => {
  const tokenService = { validate: jest.fn() } as unknown as TokenService;
  const helper = new ControllerHelper(tokenService, new FileTypeService(), new ChoiceService());
  let response: Response;
  let status: jest.Mock;
  let send: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    status = jest.fn();
    send = jest.fn();
    response = { status: status.mockReturnThis(), send } as unknown as Response;
  });

  it('returns the action result when error handling succeeds', async () => {
    await expect(helper.withErrorHandling(async () => 'ok', response)).resolves.toBe('ok');
    expect(status).not.toHaveBeenCalled();
  });

  it.each([
    [new NotFoundError('missing'), 404, 'missing'],
    [new AuthorizationError('denied'), 401, 'denied'],
    [new BadRequestError('invalid'), 400, 'invalid'],
    [new InternalError('broken'), 500, 'broken'],
    [new Error('unexpected'), 500, 'Internal server error'],
  ])('maps %s to HTTP %i', async (error, code, message) => {
    await helper.withErrorHandling(async () => { throw error; }, response);

    expect(status).toHaveBeenCalledWith(code);
    expect(send).toHaveBeenCalledWith({ error: message });
  });

  it('rejects invalid callback tokens without running the action', async () => {
    jest.mocked(tokenService.validate).mockReturnValue(false);
    const action = jest.fn();

    await helper.withCallbackErrorHandling('signed-data', 'bad-token', {
      status: CallbackStatus.COMPLETED,
      data: '',
    }, action, response);

    expect(status).toHaveBeenCalledWith(401);
    expect(send).toHaveBeenCalledWith({ error: 'Invalid token' });
    expect(action).not.toHaveBeenCalled();
  });

  it('rejects unknown callback statuses', async () => {
    jest.mocked(tokenService.validate).mockReturnValue(true);
    const action = jest.fn();

    await helper.withCallbackErrorHandling('signed-data', 'good-token', {
      status: 'unknown' as CallbackStatus,
      data: '',
    }, action, response);

    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith({ error: 'Callback data is invalid or missing status' });
    expect(action).not.toHaveBeenCalled();
  });

  it.each(Object.values(CallbackStatus))('runs the callback action for %s data', async (callbackStatus) => {
    jest.mocked(tokenService.validate).mockReturnValue(true);
    const callbackData = { status: callbackStatus, data: 'result' };
    const action = jest.fn().mockResolvedValue(undefined);

    await helper.withCallbackErrorHandling('signed-data', 'good-token', callbackData, action, response);

    expect(action).toHaveBeenCalledWith(callbackData);
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({});
  });

  it('returns an internal error when callback processing throws', async () => {
    jest.mocked(tokenService.validate).mockReturnValue(true);

    await helper.withCallbackErrorHandling('signed-data', 'good-token', {
      status: CallbackStatus.COMPLETED,
      data: 'result',
    }, async () => { throw new Error('processing failed'); }, response);

    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('returns the file type for supported uploads and rejects unsupported types', () => {
    expect(helper.initIndexing({ mimetype: 'application/pdf' } as Express.Multer.File)).toBe('pdf');
    expect(() => helper.initIndexing({ mimetype: 'text/plain' } as Express.Multer.File))
      .toThrow('Invalid request: no file uploaded or unsupported file type');
  });
});
