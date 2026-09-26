jest.mock('../../config', () => ({
  Config: {
    apiKey: 'test-api-key',
    batch: { session: () => 'https://batch.test/sessions/new' },
  },
}));

import { BatchClient } from '../../infrastructure/services/batchClient';

describe('BatchClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('posts the batch session request with authorization', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await new BatchClient().createSession('session-1', 'batch-1');

    expect(fetchMock).toHaveBeenCalledWith('https://batch.test/sessions/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-api-key',
      },
      body: JSON.stringify({ name: 'session-1', batch: 'batch-1' }),
    });
  });

  it('throws when the batch API responds unsuccessfully', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, statusText: 'Unavailable' });

    await expect(new BatchClient().createSession('session-1', 'batch-1'))
      .rejects.toThrow('Failed to create session: Unavailable');
  });
});