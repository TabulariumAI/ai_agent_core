import 'reflect-metadata';

import { CalcController } from '../../api/controllers/calcController';
import { EndorseController } from '../../api/controllers/endorseController';
import { RedactController } from '../../api/controllers/redactController';
import { ReprocessController } from '../../api/controllers/reprocessController';
import { SessionCallbackData } from '../../core/entities/callback';
import { SegmentService } from '../../infrastructure/services/segmentService';

const response = {} as never;

function actionRunningHelper() {
  return {
    withErrorHandling: jest.fn(async (action: () => Promise<unknown>) => action()),
  } as never;
}

describe('session operation controllers', () => {
  it('maps calc requests to a session callback payload', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const controller = new CalcController(actionRunningHelper(), { execute } as never);

    await expect(controller.calc({} as never, response, 'session-1', '{"value":1}')).resolves.toEqual({});

    expect(execute).toHaveBeenCalledWith({
      sessionData: new SessionCallbackData('session-1'),
      metaData: '{"value":1}',
    });
  });

  it('maps endorse requests to a session callback payload', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const controller = new EndorseController(actionRunningHelper(), { execute } as never);

    await expect(controller.endorse({} as never, response, 'session-2', '{"title":"doc"}'))
      .resolves.toEqual({});

    expect(execute).toHaveBeenCalledWith({
      sessionData: new SessionCallbackData('session-2'),
      metaData: '{"title":"doc"}',
    });
  });

  it('maps redact requests to a session callback payload', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const controller = new RedactController(actionRunningHelper(), { execute } as never);

    await expect(controller.redact({} as never, response, 'session-3', null)).resolves.toEqual({});

    expect(execute).toHaveBeenCalledWith({
      sessionData: new SessionCallbackData('session-3'),
      metaData: null,
    });
  });

  it('passes valid reprocess segments and rejects invalid ones before execution', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const segmentService = new SegmentService();
    const controller = new ReprocessController(actionRunningHelper(), { execute } as never, segmentService);

    await expect(controller.refine({} as never, response, 'session-4', 'party')).resolves.toEqual({});
    expect(execute).toHaveBeenCalledWith({
      sessionData: new SessionCallbackData('session-4'),
      segment: 'party',
    });

    execute.mockClear();
    const errorHelper = {
      withErrorHandling: jest.fn(async (action: () => Promise<unknown>) => {
        try {
          return await action();
        } catch (error) {
          return error;
        }
      }),
    } as never;
    const invalidController = new ReprocessController(errorHelper, { execute } as never, segmentService);
    await expect(invalidController.refine({} as never, response, 'session-4', 'unknown'))
      .resolves.toMatchObject({ message: 'Invalid segment' });
    expect(execute).not.toHaveBeenCalled();
  });
});