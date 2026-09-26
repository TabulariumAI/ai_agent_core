import { SessionCallbackData } from '../../core/entities/callback';

describe('SessionCallbackData', () => {
  it('creates a query path with only the session identifier', () => {
    expect(new SessionCallbackData('session-1').getPath()).toBe('sn=session-1');
  });

  it('includes batch and task identifiers when task callback data is present', () => {
    const session = new SessionCallbackData('session-1', { id: 'task-1', batch: 'batch-1' });

    expect(session.getPath()).toBe('sn=session-1&bt=batch-1&tk=task-1');
  });
});