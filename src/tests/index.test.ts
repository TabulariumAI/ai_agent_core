import 'reflect-metadata';

const mockListen = jest.fn((_port: number, callback: () => void) => {
  callback();
  return { close: jest.fn() };
});
const mockApp = { listen: mockListen };
const mockExpress = jest.fn(() => mockApp);
const mockSetupContainer = jest.fn();
const mockContainer = {};
const mockStartIndexProcessor = jest.fn().mockResolvedValue(undefined);
const mockStartRedactProcessor = jest.fn().mockResolvedValue(undefined);

jest.mock('express', () => ({ __esModule: true, default: mockExpress }));
jest.mock('dotenv', () => ({ __esModule: true, default: { config: jest.fn() } }));
jest.mock('dotenv/config', () => ({}));
jest.mock('../config', () => ({
  Config: {
    batchIndexIn: 'index-in',
    batchIndexOut: 'index-out',
    batchRedactIn: 'redact-in',
    batchRedactOut: 'redact-out',
  },
}));
jest.mock('routing-controllers', () => ({
  ...jest.requireActual('routing-controllers'),
  useContainer: jest.fn(),
  useExpressServer: jest.fn(),
}));
jest.mock('../di/container', () => ({ setupContainer: mockSetupContainer, Container: mockContainer }));
jest.mock('../application/processors/processorRegistry', () => ({
  startIndexProcessor: mockStartIndexProcessor,
  startRedactProcessor: mockStartRedactProcessor,
}));

import { useContainer, useExpressServer } from 'routing-controllers';
import dotenv from 'dotenv';
import { Container, setupContainer } from '../di/container';
import { startIndexProcessor, startRedactProcessor } from '../application/processors/processorRegistry';
import { app, createApp, startServer } from '../index';

// Capture import side effects before beforeEach clears mock calls.
const importCalls = {
  listen: mockListen.mock.calls.length,
  index: mockStartIndexProcessor.mock.calls.length,
  redact: mockStartRedactProcessor.mock.calls.length,
};

describe('application bootstrap', () => {
  it('does not start the listener or workers during import', () => {
    expect(importCalls).toEqual({ listen: 0, index: 0, redact: 0 });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an Express app and registers all controllers without starting services', () => {
    const createdApp = createApp();

    expect(createdApp).toBe(mockApp);
    expect(mockExpress).toHaveBeenCalledTimes(1);
    expect(useExpressServer).toHaveBeenCalledWith(mockApp, expect.objectContaining({ defaultErrorHandler: false }));
    const options = jest.mocked(useExpressServer).mock.calls[0][1] as { controllers: unknown[] };
    expect(options.controllers).toHaveLength(18);
    expect(mockListen).not.toHaveBeenCalled();
    expect(startIndexProcessor).not.toHaveBeenCalled();
    expect(startRedactProcessor).not.toHaveBeenCalled();
  });

  it('loads configuration, configures dependency injection, listens, and starts workers', () => {
    const server = startServer(4321);

    expect(dotenv.config).toHaveBeenCalledTimes(1);
    expect(setupContainer).toHaveBeenCalledTimes(1);
    expect(useContainer).toHaveBeenCalledWith(Container);
    expect(mockListen).toHaveBeenCalledWith(4321, expect.any(Function));
    expect(startIndexProcessor).toHaveBeenCalledTimes(1);
    expect(startRedactProcessor).toHaveBeenCalledTimes(1);
    expect(server).toEqual({ close: expect.any(Function) });
  });

  it('uses port 3000 when no server port is supplied', () => {
    startServer();

    expect(mockListen).toHaveBeenCalledWith(3000, expect.any(Function));
  });

  it('exports a configured app without starting the listener', () => {
    expect(app).toBe(mockApp);
    expect(mockListen).not.toHaveBeenCalled();
  });
});
