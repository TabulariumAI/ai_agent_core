const mockClose = jest.fn();
const mockStartServer = jest.fn(() => ({ close: mockClose }));
const mockStopIndex = jest.fn();
const mockStopRedact = jest.fn();

jest.mock('../index', () => ({ startServer: mockStartServer }));
jest.mock('../application/processors/processorRegistry', () => ({
  getIndexProcessor: () => ({ stopProcessing: mockStopIndex }),
  getRedactProcessor: () => ({ stopProcessing: mockStopRedact }),
}));

describe('server lifecycle', () => {
  let signals: Record<string, () => void>;
  let exit: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.useFakeTimers();
    signals = {};
    mockClose.mockImplementation((callback: (error?: Error) => void) => callback());
    mockStopIndex.mockResolvedValue(undefined);
    mockStopRedact.mockResolvedValue(undefined);
    jest.spyOn(process, 'once').mockImplementation(((signal: string, listener: () => void) => {
      signals[signal] = listener;
      return process;
    }) as typeof process.once);
    exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    require('../server');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('starts once and installs both termination handlers', () => {
    expect(mockStartServer).toHaveBeenCalledTimes(1);
    expect(Object.keys(signals).sort()).toEqual(['SIGINT', 'SIGTERM']);
  });

  it.each(['SIGTERM', 'SIGINT'])('waits for HTTP and workers on %s', async signal => {
    let finishWorker!: () => void;
    let finishHttp!: () => void;
    mockStopIndex.mockReturnValue(new Promise<void>(resolve => { finishWorker = resolve; }));
    mockClose.mockImplementation((callback: () => void) => { finishHttp = callback; });
    signals[signal]();
    await jest.advanceTimersByTimeAsync(0);
    expect(exit).not.toHaveBeenCalled();
    finishWorker();
    await jest.advanceTimersByTimeAsync(0);
    expect(exit).not.toHaveBeenCalled();
    finishHttp();
    await jest.advanceTimersByTimeAsync(0);
    expect(mockStopRedact).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledWith(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('only shuts down once when both signals arrive', async () => {
    signals.SIGTERM();
    signals.SIGINT();
    await jest.advanceTimersByTimeAsync(0);
    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockStopIndex).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('forces termination after 25 seconds if a worker hangs', async () => {
    mockStopIndex.mockReturnValue(new Promise<void>(() => {}));
    signals.SIGTERM();
    await jest.advanceTimersByTimeAsync(25_000);
    expect(exit).toHaveBeenCalledWith(1);
  });

  it('reports HTTP shutdown failures', async () => {
    mockClose.mockImplementation((callback: (error: Error) => void) => callback(new Error('close failed')));
    signals.SIGTERM();
    await jest.advanceTimersByTimeAsync(0);
    expect(exit).toHaveBeenCalledWith(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
