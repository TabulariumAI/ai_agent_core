import 'reflect-metadata';

jest.mock('../../config', () => ({
  Config: {
    apiKey: 'test-api-key',
    callback: { url: (path: string) => `https://callback.test/${path}` },
    compute: { calculate: (session: string) => `https://compute.test/${session}` },
    index: { document: (session: string) => `https://index.test/${session}` },
    record: { document: (session: string) => `https://record.test/${session}` },
    redact: { document: (session: string) => `https://redact.test/${session}` },
    reprocess: { document: (session: string, segment: string) => `https://reprocess.test/${session}/${segment}` },
    session: {
      get: (session: string) => `https://session.test/${session}`,
      create: () => 'https://session.test/new',
    },
    formats: { recordFormat: 'pdf', redactFormat: 'tiff' },
  },
}));

import { ComputeClient } from '../../infrastructure/aiclients/computeClient';
import { IndexClient } from '../../infrastructure/aiclients/indexClient';
import { RecordClient } from '../../infrastructure/aiclients/recordClient';
import { RedactClient } from '../../infrastructure/aiclients/redactClient';
import { ReprocessClient } from '../../infrastructure/aiclients/reprocessClient';
import { SessionClient } from '../../infrastructure/aiclients/sessionClient';
import { FileTypeService } from '../../infrastructure/services/fileTypeService';
import { Callback, SessionCallbackData } from '../../core/entities/imports';
import { Config } from '../../config';

const context = { workflow: 'test', step: 'test' };
const session = new SessionCallbackData('session-1', { id: 'task-1', batch: 'batch-1' });
const tokenService = { sign: jest.fn((path: string) => `signed:${path}`) };

describe('outbound API clients', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it.each([
    {
      name: 'compute',
      call: (client: ComputeClient) => client.calcDocument(context, session, 'metadata', Callback.CALC),
      url: 'https://compute.test/session-1',
      path: 'calc?sn=session-1&bt=batch-1&tk=task-1',
      body: { data: 'metadata' },
    },
    {
      name: 'index',
      call: (client: IndexClient) => client.indexDocument(context, session, 'session-1.pdf', [{ service: 'Indexing', level: 1 }], Callback.INDEX),
      url: 'https://index.test/session-1',
      path: 'index?sn=session-1&bt=batch-1&tk=task-1',
      body: { doc_name: 'session-1.pdf', choices: [{ service: 'Indexing', level: 1 }] },
    },
    {
      name: 'reprocess',
      call: (client: ReprocessClient) => client.reprocessDocument(context, session, 'party', Callback.REPROCESS),
      url: 'https://reprocess.test/session-1/party',
      path: 'reprocess?sn=session-1&bt=batch-1&tk=task-1',
      body: {},
    },
  ])('constructs the $name request and signs its callback path', async ({ call, url, path, body }) => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    const client = new (call.toString().includes('calcDocument') ? ComputeClient : call.toString().includes('indexDocument') ? IndexClient : ReprocessClient)(tokenService as never);

    await call(client as never);

    const [, request] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe(url);
    expect(request.method).toBe('POST');
    expect(request.headers).toEqual({ Authorization: 'Bearer test-api-key', 'Content-Type': 'application/json' });
    expect(JSON.parse(request.body as string)).toEqual({
      ...body,
      callback_url: `https://callback.test/${path}`,
      callback_token: `signed:${path}`,
    });
  });

  it.each([
    ['compute', () => new ComputeClient(tokenService as never).calcDocument(context, session, null, Callback.CALC), 'Failed to calculat document: Unavailable'],
    ['index', () => new IndexClient(tokenService as never).indexDocument(context, session, 'doc.pdf', [], Callback.INDEX), 'Failed to index document: Unavailable'],
    ['reprocess', () => new ReprocessClient(tokenService as never).reprocessDocument(context, session, 'party', Callback.REPROCESS), 'Failed to reprocess document: Unavailable'],
  ])('reports unsuccessful %s responses', async (_name, call, message) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, statusText: 'Unavailable' });

    await expect(call()).rejects.toThrow(message);
  });

  it('sends record requests with format choices', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    const client = new RecordClient(tokenService as never, new FileTypeService());

    await client.endorseDocument(context, session, 'metadata', Callback.ENDORSE);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      data: 'metadata',
      choices: { tif_record: false, pdf_record: true, pdf_confirmation: true },
    });
  });

  it('selects TIFF record output when configured', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    Config.formats.recordFormat = 'tiff';

    await new RecordClient(tokenService as never, new FileTypeService())
      .endorseDocument(context, session, 'metadata', Callback.ENDORSE);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).choices)
      .toEqual({ tif_record: true, pdf_record: false, pdf_confirmation: true });
    Config.formats.recordFormat = 'pdf';
  });

  it('sends redact requests with format choices', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    const client = new RedactClient(tokenService as never, new FileTypeService());

    await client.redactDocument(context, session, null, Callback.REDACT);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toMatchObject({
      data: null,
      choices: { tif_redaction: true, pdf_redaction: false },
    });
  });

  it('selects PDF redact output when configured', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;
    Config.formats.redactFormat = 'pdf';

    await new RedactClient(tokenService as never, new FileTypeService())
      .redactDocument(context, session, 'metadata', Callback.REDACT);

    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).choices)
      .toEqual({ tif_redaction: false, pdf_redaction: true });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string).data).toBe('metadata');
    Config.formats.redactFormat = 'tiff';
  });

  it.each([
    ['record', () => new RecordClient(tokenService as never, new FileTypeService()).endorseDocument(context, session, 'metadata', Callback.ENDORSE), 'Failed to endorse document: Unavailable'],
    ['redact', () => new RedactClient(tokenService as never, new FileTypeService()).redactDocument(context, session, null, Callback.REDACT), 'Failed to redact document: Unavailable'],
  ])('reports unsuccessful %s responses', async (_name, call, message) => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, statusText: 'Unavailable' });

    await expect(call()).rejects.toThrow(message);
  });

  it('maps successful session responses to session token fields', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ base_url: 'https://blob.test', sas_token: 'sas=token' }) });
    const client = new SessionClient(tokenService as never);

    await expect(client.getSession(context, 'session-1')).resolves.toEqual({ baseUrl: 'https://blob.test', token: 'sas=token' });
  });

  it('rejects unsuccessful and empty session lookup responses', async () => {
    const client = new SessionClient(tokenService as never);
    global.fetch = jest.fn().mockResolvedValue({ ok: false, statusText: 'Missing' });
    await expect(client.getSession(context, 'session-1')).rejects.toThrow('Failed to get session: Missing');

    global.fetch = jest.fn().mockResolvedValue({ ok: true, statusText: 'OK', json: async () => null });
    await expect(client.getSession(context, 'session-1')).rejects.toThrow('Failed to get session: OK');
  });

  it('creates sessions and rejects unsuccessful or empty responses', async () => {
    const client = new SessionClient(tokenService as never);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ session: 'new-session' }) });
    await expect(client.createSession(context, 'pdf')).resolves.toBe('new-session');

    global.fetch = jest.fn().mockResolvedValue({ ok: false, statusText: 'Unavailable' });
    await expect(client.createSession(context, 'pdf')).rejects.toThrow('Failed to create session: Unavailable');

    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => null });
    await expect(client.createSession(context, 'pdf')).rejects.toThrow('Invalid session data received');
  });
});