import 'reflect-metadata';
import { Readable } from 'stream';

jest.mock('@azure/storage-blob', () => ({ BlockBlobClient: jest.fn() }));

import { AzureBlobService } from '../../infrastructure/services/azureBlobService';

const MockBlockBlobClient = jest.requireMock('@azure/storage-blob').BlockBlobClient as jest.Mock;

describe('AzureBlobService', () => {
  let service: AzureBlobService;
  let uploadStream: jest.Mock;
  let download: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    uploadStream = jest.fn().mockResolvedValue(undefined);
    download = jest.fn();
    MockBlockBlobClient.mockImplementation(() => ({ uploadStream, download }));
    service = new AzureBlobService();
  });

  it('uploads a readable stream with the expected blob options', async () => {
    const stream = Readable.from(['content']);

    await service.upload('https://blob.test/document', stream);

    expect(MockBlockBlobClient).toHaveBeenCalledWith('https://blob.test/document');
    expect(uploadStream).toHaveBeenCalledWith(stream, 4 * 1024 * 1024, 20, {
      blobHTTPHeaders: { blobContentType: 'application/octet-stream' },
    });
  });

  it('returns the readable stream from a successful download', async () => {
    const stream = Readable.from(['payload']);
    download.mockResolvedValue({ readableStreamBody: stream });

    await expect(service.download('https://blob.test/document')).resolves.toBe(stream);
    expect(download).toHaveBeenCalledWith(0);
  });

  it('wraps download failures when no stream body is available', async () => {
    download.mockResolvedValue({ readableStreamBody: undefined });

    await expect(service.download('https://blob.test/missing'))
      .rejects.toThrow('Error downloading blob from URL: https://blob.test/missing');
  });

  it('combines downloaded chunks into content with the requested type', async () => {
    download.mockResolvedValue({ readableStreamBody: Readable.from([Buffer.from('one'), Buffer.from('two')]) });

    await expect(service.downloadContent('https://blob.test/document', 'json')).resolves.toEqual({
      documentType: 'json',
      data: Buffer.from('onetwo'),
    });
  });

  it('wraps download-content failures', async () => {
    download.mockResolvedValue({ readableStreamBody: undefined });

    await expect(service.downloadContent('https://blob.test/missing', 'pdf'))
      .rejects.toThrow('Error downloading blob from URL: https://blob.test/missing');
  });

  it('wraps stream errors while reading downloaded content', async () => {
    const failingStream = Readable.from((async function* () {
      throw new Error('stream interrupted');
    })());
    download.mockResolvedValue({ readableStreamBody: failingStream });

    await expect(service.downloadContent('https://blob.test/document', 'pdf'))
      .rejects.toThrow('Error downloading blob from URL: https://blob.test/document');
  });

  it('converts downloaded chunks to UTF-8 text', async () => {
    download.mockResolvedValue({ readableStreamBody: Readable.from([Buffer.from('hello '), Buffer.from('world')]) });

    await expect(service.downloadString('https://blob.test/document')).resolves.toBe('hello world');
  });

  it('wraps download-string failures', async () => {
    download.mockRejectedValue(new Error('storage unavailable'));

    await expect(service.downloadString('https://blob.test/missing'))
      .rejects.toThrow('Error downloading blob from URL: https://blob.test/missing');
  });

  it('wraps download-string responses without a readable body', async () => {
    download.mockResolvedValue({ readableStreamBody: undefined });

    await expect(service.downloadString('https://blob.test/empty'))
      .rejects.toThrow('Error downloading blob from URL: https://blob.test/empty');
  });

  it('wraps stream errors while reading downloaded text', async () => {
    const failingStream = Readable.from((async function* () {
      throw new Error('stream interrupted');
    })());
    download.mockResolvedValue({ readableStreamBody: failingStream });

    await expect(service.downloadString('https://blob.test/document'))
      .rejects.toThrow('Error downloading blob from URL: https://blob.test/document');
  });
});