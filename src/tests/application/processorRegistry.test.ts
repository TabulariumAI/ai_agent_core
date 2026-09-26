jest.mock('../../di/container', () => ({
  Container: { get: jest.fn() },
}));

import { Container } from '../../di/container';
import { TOKENS } from '../../core/tokens';
import { getIndexProcessor, getRedactProcessor, startIndexProcessor, startRedactProcessor } from '../../application/processors/processorRegistry';

describe('processor registry', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves the index and redact processors by their tokens', () => {
    const indexProcessor = { processTasks: jest.fn() };
    const redactProcessor = { processTasks: jest.fn() };
    jest.mocked(Container.get).mockReturnValueOnce(indexProcessor as never).mockReturnValueOnce(redactProcessor as never);

    expect(getIndexProcessor()).toBe(indexProcessor);
    expect(getRedactProcessor()).toBe(redactProcessor);
    expect(Container.get).toHaveBeenNthCalledWith(1, TOKENS.IndexTaskProcessor);
    expect(Container.get).toHaveBeenNthCalledWith(2, TOKENS.RedactTaskProcessor);
  });

  it('starts processing on the registered processors', async () => {
    const indexProcessor = { processTasks: jest.fn().mockResolvedValue(undefined) };
    const redactProcessor = { processTasks: jest.fn().mockResolvedValue(undefined) };
    jest.mocked(Container.get).mockReturnValueOnce(indexProcessor as never).mockReturnValueOnce(redactProcessor as never);

    await expect(startIndexProcessor()).resolves.toBeUndefined();
    await expect(startRedactProcessor()).resolves.toBeUndefined();
    expect(indexProcessor.processTasks).toHaveBeenCalledTimes(1);
    expect(redactProcessor.processTasks).toHaveBeenCalledTimes(1);
  });
});