import 'reflect-metadata';
import { Readable } from 'stream';

jest.mock('../../config', () => ({ Config: { batchContainer: 'https://container.test' } }));
jest.mock('@azure/storage-blob', () => ({ ContainerClient: jest.fn() }));

import { ContainerClient } from '@azure/storage-blob';
import { AzureBatchSourceRepository } from '../../infrastructure/repositories/azureBatchSourceRepository';
import { FileTypeService } from '../../infrastructure/services/fileTypeService';
import { BatchReport } from '../../core/entities/batch';

const MockContainerClient = ContainerClient as unknown as jest.Mock;

describe('AzureBatchSourceRepository', () => {
  let repository: AzureBatchSourceRepository;
  let listBlobsFlat: jest.Mock;
  let getBlobClient: jest.Mock;
  let getBlockBlobClient: jest.Mock;
  let blobClient: {
    exists: jest.Mock;
    getProperties: jest.Mock;
    downloadToBuffer: jest.Mock;
    uploadData: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    listBlobsFlat = jest.fn();
    blobClient = {
      exists: jest.fn(),
      getProperties: jest.fn(),
      downloadToBuffer: jest.fn(),
      uploadData: jest.fn().mockResolvedValue(undefined),
    };
    getBlobClient = jest.fn().mockReturnValue(blobClient);
    getBlockBlobClient = jest.fn().mockReturnValue(blobClient);
    MockContainerClient.mockImplementation(() => ({ listBlobsFlat, getBlobClient, getBlockBlobClient }));
    repository = new AzureBatchSourceRepository(new FileTypeService());
  });

  it('lists batch items relative to the requested prefix', async () => {
    listBlobsFlat.mockReturnValue((async function* () {
      yield { name: 'input/batch-1/a.pdf' };
      yield { name: 'input/batch-1/nested/b.tiff' };
    })());

    await expect(repository.getBatch('input', 'batch-1')).resolves.toEqual({
      name: 'batch-1',
      items: ['a.pdf', 'nested/b.tiff'],
    });
    expect(MockContainerClient).toHaveBeenCalledWith('https://container.test');
    expect(listBlobsFlat).toHaveBeenCalledWith({ prefix: 'input/batch-1/' });
  });

  it('returns null for an empty batch prefix', async () => {
    listBlobsFlat.mockReturnValue((async function* () {})());

    await expect(repository.getBatch('input', 'empty')).resolves.toBeNull();
  });

  it('downloads content and maps its MIME type to a document type', async () => {
    blobClient.exists.mockResolvedValue(true);
    blobClient.getProperties.mockResolvedValue({ contentType: 'application/pdf' });
    blobClient.downloadToBuffer.mockResolvedValue(Buffer.from('pdf-data'));

    await expect(repository.getContent('input', 'batch-1', 'a.pdf')).resolves.toEqual({
      documentType: 'pdf',
      data: new Uint8Array(Buffer.from('pdf-data')),
    });
    expect(getBlobClient).toHaveBeenCalledWith('input/batch-1/a.pdf');
  });

  it('returns null for missing content', async () => {
    blobClient.exists.mockResolvedValue(false);

    await expect(repository.getContent('input', 'batch-1', 'missing.pdf')).resolves.toBeNull();
    expect(blobClient.getProperties).not.toHaveBeenCalled();
  });

  it('rejects existing content with an unsupported or missing MIME type', async () => {
    blobClient.exists.mockResolvedValue(true);
    blobClient.getProperties.mockResolvedValue({ contentType: undefined });

    await expect(repository.getContent('input', 'batch-1', 'unknown.bin'))
      .rejects.toThrow('Unsupported file type:');
  });

  it('uploads content with MIME type derived from its document type', async () => {
    const content = { documentType: 'tiff', data: new Uint8Array(Buffer.from('image')) };

    await repository.setContent('output', 'batch-1', 'a.tiff', content);

    expect(getBlockBlobClient).toHaveBeenCalledWith('output/batch-1/a.tiff');
    expect(blobClient.uploadData).toHaveBeenCalledWith(Buffer.from('image'), {
      blobHTTPHeaders: { blobContentType: 'image/tiff' },
    });
  });

  it('uploads reports as JSON', async () => {
    const report: BatchReport = {
      batch: { name: 'batch-1', type: 'index' as never },
      items: [{ status: 'success', count: 2 }],
    };

    await repository.setReport('output', 'batch-1', report);

    expect(getBlockBlobClient).toHaveBeenCalledWith('output/batch-1/report.json');
    expect(blobClient.uploadData).toHaveBeenCalledWith(Buffer.from(JSON.stringify(report)), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
  });
});