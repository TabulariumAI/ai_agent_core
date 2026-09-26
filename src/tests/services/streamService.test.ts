import { Readable } from 'stream';

import { StreamService } from '../../infrastructure/services/streamService';

describe('StreamService', () => {
  const service = new StreamService();

  it('concatenates stream chunks as text', async () => {
    await expect(service.streamToString(Readable.from(['hello ', Buffer.from('world')]))).resolves.toBe('hello world');
  });

  it('converts stream errors into a stable read error', async () => {
    const stream = new Readable({ read() {} });
    const result = service.streamToString(stream);
    stream.destroy(new Error('source failed'));

    await expect(result).rejects.toThrow('Error reading stream');
  });

  it('rejects streams closed before completion', async () => {
    const stream = new Readable({ read() {} });
    const result = service.streamToString(stream);
    stream.emit('close');

    await expect(result).rejects.toThrow('Stream closed');
  });

  it('normalizes errors thrown while converting a stream chunk', async () => {
    const stream = new Readable({ read() {} });
    const result = service.streamToString(stream);
    stream.emit('data', { toString: () => { throw new Error('conversion failed'); } });

    await expect(result).rejects.toThrow('Error processing stream data');
  });
});