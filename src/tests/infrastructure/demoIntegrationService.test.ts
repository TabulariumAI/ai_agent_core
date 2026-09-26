import 'reflect-metadata';
import * as fs from 'fs';

import { DemoIntegrationService } from '../../infrastructure/services/demoIntegrationService';
import { CallbackService } from '../../infrastructure/services/callbackService';
import { FileTypeService } from '../../infrastructure/services/fileTypeService';
import { SessionCallbackData } from '../../core/entities/callback';

describe('DemoIntegrationService', () => {
  let service: DemoIntegrationService;
  let mkdir: jest.SpyInstance;
  let writeFile: jest.SpyInstance;
  let logger: { info: jest.Mock; error: jest.Mock };

  beforeEach(() => {
    mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue('' as never);
    writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    logger = { info: jest.fn(), error: jest.fn() };
    service = new DemoIntegrationService(new FileTypeService(), new CallbackService(), logger as never);
  });

  afterEach(() => {
    mkdir.mockRestore();
    writeFile.mockRestore();
  });

  it.each(['processIndex', 'processRefine', 'processCalc', 'processProvision'] as const)(
    '%s saves metadata as formatted JSON when metadata is present', async (method) => {
      const session = new SessionCallbackData('test-session');
      const metadata = { heading: { title: 'Test' } };

      await service[method](session, { metaData: metadata } as never);

      expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('test-session'), { recursive: true });
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringContaining('metadata.json'),
        JSON.stringify(metadata, null, 2),
      );
      expect(logger.info).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['processIndex', 'processRefine', 'processCalc', 'processProvision'] as const)(
    '%s does nothing when metadata is absent', async (method) => {
      await service[method](new SessionCallbackData('test-session'), { error: 'failed' } as never);

      expect(mkdir).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    },
  );

  it.each(['processRedact', 'processAutoRedact', 'processEndorse', 'processAutoRecord'] as const)(
    '%s saves content and logs the result', async (method) => {
      const content = { documentType: 'application/pdf', data: Buffer.from('document') };

      await service[method](new SessionCallbackData('test-session'), { content });

      expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('test-session'), { recursive: true });
      expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('document.pdf'), content.data);
      expect(logger.info).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['processRedact', 'processAutoRedact', 'processEndorse', 'processAutoRecord'] as const)(
    '%s does nothing when content is absent', async (method) => {
      await service[method](new SessionCallbackData('test-session'), { error: 'failed' } as never);

      expect(mkdir).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    },
  );

  it('wraps metadata directory and file write errors', async () => {
    mkdir.mockRejectedValueOnce(new Error('permission denied'));
    await expect(service.processIndex(new SessionCallbackData('test-session'), { metaData: {} } as never))
      .rejects.toThrow('Failed to save Json file');

    mkdir.mockResolvedValueOnce('' as never);
    writeFile.mockRejectedValueOnce(new Error('disk full'));
    await expect(service.processIndex(new SessionCallbackData('test-session'), { metaData: {} } as never))
      .rejects.toThrow('Failed to save Json file');
  });

  it('wraps document directory and file write errors', async () => {
    const session = new SessionCallbackData('test-session');
    const context = { content: { documentType: 'application/pdf', data: Buffer.from('document') } };
    mkdir.mockRejectedValueOnce(new Error('permission denied'));

    await expect(service.processRedact(session, context)).rejects.toThrow('Failed to create directory:');

    mkdir.mockResolvedValueOnce('' as never);
    writeFile.mockRejectedValueOnce(new Error('disk full'));
    await expect(service.processRedact(session, context)).rejects.toThrow('Failed to save document:');
  });

  it('updates the heading number and date when recording metadata', async () => {
    const result = JSON.parse(await service.record('session-1', JSON.stringify({ heading: { title: 'Deed' } })));

    expect(result.heading.title).toBe('Deed');
    expect(result.heading.number).toMatch(/^\d{3}$/);
    expect(Number.isNaN(Date.parse(result.heading.date))).toBe(false);
  });
});