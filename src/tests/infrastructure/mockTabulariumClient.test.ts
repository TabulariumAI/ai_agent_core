import 'reflect-metadata';

import { MockTabulariumClient } from '../../infrastructure/aiclients/mockTabulariumClient';
import { Callback, SessionCallbackData } from '../../core/entities/imports';

describe('MockTabulariumClient', () => {
  const originalFetch = global.fetch;
  const originalCallbackUrl = process.env.CALLBACK_URL;
  const tokenService = { sign: jest.fn((value: string) => `signed:${value}`) };
  let client: MockTabulariumClient;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CALLBACK_URL = 'https://callback.test';
    client = new MockTabulariumClient(tokenService as never);
  });

  afterAll(() => {
    global.fetch = originalFetch;
    if (originalCallbackUrl === undefined) delete process.env.CALLBACK_URL;
    else process.env.CALLBACK_URL = originalCallbackUrl;
  });

  it('returns an empty session token and generates session identifiers', async () => {
    await expect(client.getSession({ workflow: 'test', step: 'session' }, 'session-1'))
      .resolves.toEqual({ baseUrl: '', token: '' });
    await expect(client.createSession({ workflow: 'test', step: 'session' }, 'pdf'))
      .resolves.toMatch(/^[0-9a-f-]{36}$/i);
  });

  it.each([
    ['indexDocument', Callback.INDEX],
    ['reprocessDocument', Callback.REPROCESS],
    ['calcDocument', Callback.CALC],
    ['redactDocument', Callback.REDACT],
    ['endorseDocument', Callback.ENDORSE],
  ] as const)('%s posts a completed callback', async (method, callback) => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    const sessionData = new SessionCallbackData('session-1');

    if (method === 'indexDocument') {
      await client.indexDocument({ workflow: 'test', step: 'index' }, sessionData, 'document.pdf', [], callback);
    } else if (method === 'reprocessDocument') {
      await client.reprocessDocument({ workflow: 'test', step: 'reprocess' }, sessionData, 'party', callback);
    } else if (method === 'calcDocument') {
      await client.calcDocument({ workflow: 'test', step: 'calc' }, sessionData, null, callback);
    } else if (method === 'redactDocument') {
      await client.redactDocument({ workflow: 'test', step: 'redact' }, sessionData, null, callback);
    } else {
      await client.endorseDocument({ workflow: 'test', step: 'endorse' }, sessionData, 'metadata', callback);
    }

    const data = `sn=${JSON.stringify(sessionData)}`;
    expect(tokenService.sign).toHaveBeenCalledWith(data);
    expect(fetchMock).toHaveBeenCalledWith(`https://callback.test/${callback}?${data}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `signed:${data}` },
      body: JSON.stringify({ status: 'completed', data: 'https://example.com/test.json' }),
    });
  });

  it('posts record callbacks with the flat session identifier', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    await client.recordDocument('session-2', Callback.ENDORSE);

    expect(tokenService.sign).toHaveBeenCalledWith('sn=session-2');
    expect(fetchMock).toHaveBeenCalledWith('https://callback.test/endorse?sn=session-2', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ status: 'completed', data: 'https://example.com/test.json' }),
    }));
  });
});