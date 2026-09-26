import { ConsoleLogger } from '../../infrastructure/services/consoleLogger';
import { DemoTrackingService } from '../../infrastructure/services/demoTrackingService';

describe('ConsoleLogger', () => {
  it('writes info and error messages to their matching console methods', () => {
    const logger = new ConsoleLogger();
    const info = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    logger.info('started');
    logger.error('failed');

    expect(info).toHaveBeenCalledWith('INFO: started');
    expect(error).toHaveBeenCalledWith('ERROR: failed');
    info.mockRestore();
    error.mockRestore();
  });
});

describe('DemoTrackingService', () => {
  it('logs successful workflow tracking', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new DemoTrackingService();

    await service.trackSuccess({ workflow: 'index', step: 'upload' }, 'session-1');

    expect(log).toHaveBeenCalledWith('Tracking success for session: session-1, workflow: index, step: upload');
    log.mockRestore();
  });

  it('logs errors with their workflow context and message', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const service = new DemoTrackingService();

    await service.trackError({ workflow: 'redact', step: 'callback' }, 'session-2', 'bad payload');

    expect(log).toHaveBeenCalledWith(
      'Tracking: session: session-2, workflow: redact, step: callback, status: error, error: bad payload',
    );
    log.mockRestore();
  });
});