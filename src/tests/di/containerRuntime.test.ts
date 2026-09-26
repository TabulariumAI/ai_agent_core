import 'reflect-metadata';

jest.mock('../../config', () => ({ Config: {
  batchIndexIn: 'index-in', batchIndexOut: 'index-out',
  batchRedactIn: 'redact-in', batchRedactOut: 'redact-out',
} }));

import { setupContainer, Container } from '../../di/container';
import { TOKENS } from '../../core/tokens';
import { IndexTaskProcessor } from '../../application/processors/indexTaskProcessor';
import { RedactTaskProcessor } from '../../application/processors/redactTaskProcessor';
import { BatchClient } from '../../infrastructure/services/batchClient';

it('constructs the real processor dependency graph without external calls', () => {
  setupContainer();
  expect(Container.get(TOKENS.IBatchClient)).toBeInstanceOf(BatchClient);
  expect(Container.get(TOKENS.IndexTaskProcessor)).toBeInstanceOf(IndexTaskProcessor);
  expect(Container.get(TOKENS.RedactTaskProcessor)).toBeInstanceOf(RedactTaskProcessor);
});
