const requiredEnvironment = {
  API_KEY: 'subscription:api-key',
  BATCH_CONTAINER: 'container',
  BATCH_INDEX_IN: 'index-in',
  BATCH_INDEX_OUT: 'index-out',
  BATCH_REDACT_IN: 'redact-in',
  BATCH_REDACT_OUT: 'redact-out',
  PROCESSING_DIR: 'processing',
  CALLBACK_URL: 'https://callback.test/',
  BATCH_URL: 'https://batch.test/',
  SESSION_URL: 'https://session.test/',
  COMPUTE_URL: 'https://compute.test/',
  INDEX_URL: 'https://index.test/',
  FEEDBACK_URL: 'https://feedback.test/',
  RECORD_URL: 'https://record.test/',
  REDACT_URL: 'https://redact.test/',
  REPROCESS_URL: 'https://reprocess.test/',
};

jest.mock('dotenv/config', () => ({}));

describe('Config', () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnvironment, ...requiredEnvironment };
    delete process.env.RECORD_FORMAT;
    delete process.env.REDACT_FORMAT;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('requires configured environment values and trims trailing slashes', async () => {
    const { Config } = await import('../config');

    expect(Config.apiKey).toBe('subscription:api-key');
    expect(Config.subscription).toBe('subscription');
    expect(Config.services.callbackUrl).toBe('https://callback.test');
    expect(Config.services.reprocess).toBe('https://reprocess.test');
    expect(Config.formats).toEqual({ recordFormat: '', redactFormat: '' });
  });

  it('rejects configuration when a required environment value is missing', async () => {
    delete process.env.API_KEY;

    await expect(import('../config')).rejects.toThrow('Missing environment variable: API_KEY');
  });

  it('builds service URLs from the configured endpoints', async () => {
    const { Config } = await import('../config');

    expect(Config.callback.url('index?sn=1')).toBe('https://callback.test/index?sn=1');
    expect(Config.batch.session()).toBe('https://batch.test/subscription/subscription/batches/sessions/new');
    expect(Config.session.get('s1')).toBe('https://session.test/session/s1/data');
    expect(Config.session.create()).toBe('https://session.test/session/new');
    expect(Config.compute.calculate('s1')).toBe('https://compute.test/compute/s1/calculate');
    expect(Config.index.document('s1')).toBe('https://index.test/document/s1/index');
    expect(Config.record.document('s1')).toBe('https://record.test/record/s1/endorsement');
    expect(Config.redact.document('s1')).toBe('https://redact.test/redact/s1/mask');
    expect(Config.reprocess.document('s1', 'party')).toBe('https://reprocess.test/reprocess/s1/party');
  });

  it('loads optional format values and trims their trailing slashes', async () => {
    process.env.RECORD_FORMAT = 'pdf/';
    process.env.REDACT_FORMAT = 'tiff/';
    jest.resetModules();
    const { Config } = await import('../config');

    expect(Config.formats).toEqual({ recordFormat: 'pdf', redactFormat: 'tiff' });
  });
});
