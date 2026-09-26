import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { SessionQueryParams } from '../../api/utils/sessionQueryParam';

describe('SessionQueryParams', () => {
  it('maps the session query parameter and creates callback data', () => {
    const params = plainToInstance(SessionQueryParams, { sn: 'session-1' });

    expect(params.session).toBe('session-1');
    expect(params.toSession()).toEqual({ id: 'session-1', task: undefined });
  });

  it('maps batch and task parameters into callback data', () => {
    const params = plainToInstance(SessionQueryParams, {
      sn: 'session-1',
      bt: 'batch-1',
      tk: 'task-1',
    });

    expect(params.toSession()).toEqual({
      id: 'session-1',
      task: { id: 'task-1', batch: 'batch-1' },
    });
  });

  it('rejects a missing session identifier', async () => {
    const params = plainToInstance(SessionQueryParams, {});
    const errors = await validate(params);

    expect(errors.map((error) => error.property)).toContain('session');
    expect(() => params.toSession()).toThrow('Session (sn) is required');
  });

  it.each([
    { sn: 'session-1', bt: 'batch-1' },
    { sn: 'session-1', tk: 'task-1' },
  ])('rejects incomplete batch/task pairs: %o', async (query) => {
    const params = plainToInstance(SessionQueryParams, query);
    const errors = await validate(params);

    expect(errors.length).toBeGreaterThan(0);
  });
});