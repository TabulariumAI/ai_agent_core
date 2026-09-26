import 'reflect-metadata';
import * as fs from 'fs';

const mockIndexProcessor = { finalizeTaskSuccess: jest.fn(), finalizeTaskFailure: jest.fn() };
const mockRedactProcessor = { finalizeTaskSuccess: jest.fn(), finalizeTaskFailure: jest.fn() };

jest.mock('../../config', () => ({
  Config: { batchIndexOut: 'index-out', batchRedactOut: 'redact-out' },
}));
jest.mock('../../application/processors/processorRegistry', () => ({
  getIndexProcessor: () => mockIndexProcessor,
  getRedactProcessor: () => mockRedactProcessor,
}));

import { DemoBatchIntegrationService } from '../../infrastructure/services/demoBatchIntegrationService';
import { CallbackService } from '../../infrastructure/services/callbackService';
import { FileTypeService } from '../../infrastructure/services/fileTypeService';
import { SessionCallbackData } from '../../core/entities/callback';
import { BatchType, TaskStatus } from '../../core/entities/batch';

describe('DemoBatchIntegrationService', () => {
  let service: DemoBatchIntegrationService;
  let mkdir: jest.SpyInstance;
  let writeFile: jest.SpyInstance;
  let logger: { info: jest.Mock; error: jest.Mock };
  let batchSourceRepository: { setContent: jest.Mock };
  let batchRepository: { getTask: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mkdir = jest.spyOn(fs.promises, 'mkdir').mockResolvedValue('' as never);
    writeFile = jest.spyOn(fs.promises, 'writeFile').mockResolvedValue(undefined);
    logger = { info: jest.fn(), error: jest.fn() };
    batchSourceRepository = { setContent: jest.fn().mockResolvedValue(undefined) };
    batchRepository = { getTask: jest.fn().mockResolvedValue({ id: 'task-1', name: 'document.pdf' }) };
    service = new DemoBatchIntegrationService(
      logger as never,
      batchSourceRepository as never,
      batchRepository as never,
      new FileTypeService(),
      new CallbackService(),
    );
  });

  afterEach(() => {
    mkdir.mockRestore();
    writeFile.mockRestore();
  });

  it.each(['processRefine', 'processCalc', 'processProvision'] as const)(
    '%s writes metadata and logs when metadata exists', async (method) => {
      const metadata = { heading: { title: 'Batch item' } };

      await service[method](new SessionCallbackData('session-1'), { metaData: metadata } as never);

      expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('session-1'), { recursive: true });
      expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('metadata.json'), JSON.stringify(metadata, null, 2));
      expect(logger.info).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['processRefine', 'processCalc', 'processProvision'] as const)(
    '%s logs when metadata is absent', async (method) => {
      await service[method](new SessionCallbackData('session-1'), { error: 'failed' } as never);

      expect(mkdir).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['processRedact', 'processEndorse', 'processAutoRecord'] as const)(
    '%s writes document content when present', async (method) => {
      const content = { documentType: 'application/pdf', data: Buffer.from('document') };

      await service[method](new SessionCallbackData('session-1'), { content });

      expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('session-1'), { recursive: true });
      expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('document.pdf'), content.data);
      expect(logger.info).toHaveBeenCalledTimes(1);
    },
  );

  it.each(['processRedact', 'processEndorse', 'processAutoRecord'] as const)(
    '%s logs when document content is absent', async (method) => {
      await service[method](new SessionCallbackData('session-1'), { error: 'failed' } as never);

      expect(mkdir).not.toHaveBeenCalled();
      expect(writeFile).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledTimes(1);
    },
  );

  it('stores index metadata in batch output and finalizes the task', async () => {
    const session = new SessionCallbackData('session-1', { id: 'task-1', batch: 'batch-1' });
    const metadata = JSON.stringify({ heading: { title: 'Indexed' } });

    await service.processIndex(session, { metaData: metadata });

    expect(batchRepository.getTask).toHaveBeenCalledWith(BatchType.Index, 'batch-1', 'task-1');
    expect(batchSourceRepository.setContent).toHaveBeenCalledWith('index-out', 'batch-1', 'document.pdf', {
      documentType: 'json',
      data: Buffer.from(metadata),
    });
    expect(mockIndexProcessor.finalizeTaskSuccess).toHaveBeenCalledWith('task-1');
  });

  it('fails index tasks when metadata is absent and rejects malformed task session data', async () => {
    const session = new SessionCallbackData('session-1', { id: 'task-1', batch: 'batch-1' });

    await service.processIndex(session, { error: 'no metadata' });
    expect(mockIndexProcessor.finalizeTaskFailure).toHaveBeenCalledWith('task-1', 'No metadata to save');

    await expect(service.processIndex(new SessionCallbackData('session-1', { id: '', batch: 'batch-1' }), { metaData: '{}' }))
      .rejects.toThrow('Invalid session data:');
  });

  it('rejects index callbacks for missing tasks', async () => {
    batchRepository.getTask.mockResolvedValue(null);
    const session = new SessionCallbackData('session-1', { id: 'missing-task', batch: 'batch-1' });

    await expect(service.processIndex(session, { metaData: '{}' })).rejects.toThrow('Task not found: missing-task');
  });

  it('stores redact output and finalizes the redact task', async () => {
    const session = new SessionCallbackData('session-2', { id: 'task-2', batch: 'batch-2' });
    const content = { documentType: 'application/pdf', data: Buffer.from('redacted') };

    await service.processAutoRedact(session, { content });

    expect(batchRepository.getTask).toHaveBeenCalledWith(BatchType.Redact, 'batch-2', 'task-2');
    expect(batchSourceRepository.setContent).toHaveBeenCalledWith('redact-out', 'batch-2', 'document.pdf', {
      documentType: 'pdf',
      data: content.data,
    });
    expect(mockRedactProcessor.finalizeTaskSuccess).toHaveBeenCalledWith('task-2');
  });

  it('fails redact tasks when content is absent and rejects missing task data', async () => {
    const session = new SessionCallbackData('session-2', { id: 'task-2', batch: 'batch-2' });

    await service.processAutoRedact(session, { error: 'no content' });
    expect(mockRedactProcessor.finalizeTaskFailure).toHaveBeenCalledWith('task-2', 'No document to save');

    await expect(service.processAutoRedact(new SessionCallbackData('session-2', { id: '', batch: 'batch-2' }), { content: { documentType: 'application/pdf', data: Buffer.from('x') } }))
      .rejects.toThrow('Invalid session data:');
  });

  it('rejects redact callbacks for missing tasks', async () => {
    batchRepository.getTask.mockResolvedValue(null);
    const session = new SessionCallbackData('session-2', { id: 'missing-task', batch: 'batch-2' });

    await expect(service.processAutoRedact(session, { content: { documentType: 'application/pdf', data: Buffer.from('x') } }))
      .rejects.toThrow('Task not found: missing-task');
  });

  it('persists standalone index JSON without encoding it again', async () => {
    const metadata = '{"heading":{"title":"Standalone"}}';
    await service.processIndex(new SessionCallbackData('standalone'), { metaData: metadata });
    expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('metadata.json'), metadata);
    expect(batchRepository.getTask).not.toHaveBeenCalled();
    expect(mockIndexProcessor.finalizeTaskSuccess).not.toHaveBeenCalled();
  });

  it.each(['application/pdf', 'pdf', 'RedactPdf'])('persists standalone auto-redaction with type %s', async (documentType) => {
    const content = { documentType, data: Buffer.from('redacted') };
    await service.processAutoRedact(new SessionCallbackData('standalone'), { content });
    expect(writeFile).toHaveBeenCalledWith(expect.stringContaining('document.pdf'), content.data);
    expect(batchRepository.getTask).not.toHaveBeenCalled();
    expect(mockRedactProcessor.finalizeTaskSuccess).not.toHaveBeenCalled();
  });

  it.each(['processIndex', 'processAutoRedact'] as const)('handles standalone %s failures', async (method) => {
    await service[method](new SessionCallbackData('standalone'), { error: 'failed' });
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('failed'));
    expect(writeFile).not.toHaveBeenCalled();
    expect(batchRepository.getTask).not.toHaveBeenCalled();
  });

  it('records metadata and adds generated heading fields', async () => {
    const result = JSON.parse(await service.record('session-1', JSON.stringify({ heading: { title: 'Record' } })));

    expect(result.heading.title).toBe('Record');
    expect(result.heading.number).toMatch(/^\d{3}$/);
    expect(Number.isNaN(Date.parse(result.heading.date))).toBe(false);
  });

  it.each([
    ['processIndex', 'Index failed for session standalone: No metadata to save'],
    ['processAutoRedact', 'Auto-redaction failed for session standalone: No document to save'],
  ] as const)('logs a default error for an empty standalone %s result', async (method, message) => {
    await service[method](new SessionCallbackData('standalone'), {});

    expect(logger.error).toHaveBeenCalledWith(message);
    expect(writeFile).not.toHaveBeenCalled();
    expect(batchRepository.getTask).not.toHaveBeenCalled();
    expect(mockIndexProcessor.finalizeTaskFailure).not.toHaveBeenCalled();
    expect(mockRedactProcessor.finalizeTaskFailure).not.toHaveBeenCalled();
  });

  it('rejects unsupported standalone document types before writing output', async () => {
    await expect(service.processAutoRedact(new SessionCallbackData('standalone'), {
      content: { documentType: 'text/plain', data: Buffer.from('unsupported') },
    })).rejects.toThrow('Unsupported file type: text/plain');

    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
    expect(batchRepository.getTask).not.toHaveBeenCalled();
    expect(mockRedactProcessor.finalizeTaskSuccess).not.toHaveBeenCalled();
  });

  it('wraps metadata and document persistence failures', async () => {
    mkdir.mockRejectedValueOnce(new Error('permission denied'));
    await expect(service.processCalc(new SessionCallbackData('session-1'), { metaData: '{}' }))
      .rejects.toThrow('Failed to save Json file');

    mkdir.mockResolvedValueOnce('' as never);
    writeFile.mockRejectedValueOnce(new Error('disk full'));
    await expect(service.processCalc(new SessionCallbackData('session-1'), { metaData: '{}' }))
      .rejects.toThrow('Failed to save Json file');

    mkdir.mockRejectedValueOnce(new Error('permission denied'));
    await expect(service.processRedact(new SessionCallbackData('session-1'), {
      content: { documentType: 'application/pdf', data: Buffer.from('x') },
    })).rejects.toThrow('Failed to create directory:');

    mkdir.mockResolvedValueOnce('' as never);
    writeFile.mockRejectedValueOnce(new Error('disk full'));
    await expect(service.processRedact(new SessionCallbackData('session-1'), {
      content: { documentType: 'application/pdf', data: Buffer.from('x') },
    })).rejects.toThrow('Failed to save document:');
  });
});
