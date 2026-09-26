import 'reflect-metadata';

jest.mock('../../config', () => ({
  Config: {
    batchIndexIn: 'index-input',
    batchIndexOut: 'index-output',
    batchRedactIn: 'redact-input',
    batchRedactOut: 'redact-output',
  },
}));

import { IndexTaskProcessor } from '../../application/processors/indexTaskProcessor';
import { RedactTaskProcessor } from '../../application/processors/redactTaskProcessor';
import { BatchType } from '../../core/entities/batch';
import { Step, Workflow } from '../../core/entities/workflowContext';
import { indexChoice } from '../../core/entities/choices/indexChoice';
import { autoRedactChoice } from '../../core/entities/choices/autoRedactChoice';

describe('concrete task processor configuration', () => {
  it('configures the index processor for index batches', () => {
    const processor = new IndexTaskProcessor({} as never, {} as never, {} as never, {} as never, {} as never);
    const configured = processor as unknown as Record<string, unknown>;

    expect(configured.batchType).toBe(BatchType.Index);
    expect(configured.context).toEqual({ workflow: Workflow.INDEX, step: Step.INDEX });
    expect(configured.batchInRoot).toBe('index-input');
    expect(configured.reportRoot).toBe('index-output');
    expect(configured.choice).toBe(indexChoice);
  });

  it('configures the redact processor for redact batches', () => {
    const processor = new RedactTaskProcessor({} as never, {} as never, {} as never, {} as never, {} as never);
    const configured = processor as unknown as Record<string, unknown>;

    expect(configured.batchType).toBe(BatchType.Redact);
    expect(configured.context).toEqual({ workflow: Workflow.REDACT, step: Step.REDACT });
    expect(configured.batchInRoot).toBe('redact-input');
    expect(configured.reportRoot).toBe('redact-output');
    expect(configured.choice).toBe(autoRedactChoice);
  });
});
