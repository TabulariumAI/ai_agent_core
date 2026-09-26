import { MockBlobService } from '../../infrastructure/services/mockBlobService';

describe('MockBlobService', () => {
  const service = new MockBlobService();
  const url = 'https://example.com/test.json';

  it('accepts uploads without persisting data', async () => {
    await expect(service.upload(url, undefined as never)).resolves.toBeUndefined();
  });

  it('returns JSON metadata as a readable stream for the fixture URL', async () => {
    const stream = await service.download(url);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));

    const metadata = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    expect(metadata.heading.title).toBe('Mock Document');
    expect(metadata.secrets).toEqual([]);
  });

  it('returns generic blob text for other URLs', async () => {
    const stream = await service.download('https://example.com/other');
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));

    expect(Buffer.concat(chunks).toString('utf8')).toBe('Blob content');
  });

  it('returns metadata content with a default JSON type', async () => {
    const content = await service.downloadContent(url, '');

    expect(content.documentType).toBe('json');
    expect(JSON.parse(Buffer.from(content.data).toString('utf8')).heading.title).toBe('Mock Document');
  });

  it('uses the requested content type for the fixture URL', async () => {
    await expect(service.downloadContent(url, 'application/json')).resolves.toMatchObject({
      documentType: 'application/json',
    });
  });

  it('rejects content downloads for URLs without a fixture', async () => {
    await expect(service.downloadContent('https://example.com/missing', 'json'))
      .rejects.toThrow('No content found for URL: https://example.com/missing');
  });

  it('returns metadata as a string for the fixture URL', async () => {
    const value = await service.downloadString(url);

    expect(JSON.parse(value).heading.title).toBe('Mock Document');
  });

  it('rejects string downloads for URLs without a fixture', async () => {
    await expect(service.downloadString('https://example.com/missing'))
      .rejects.toThrow('No content found for URL: https://example.com/missing');
  });
});