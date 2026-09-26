import * as fs from 'fs/promises';
import fsSync from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.mock('../../config', () => ({ Config: { processingDir: '' } }));

import { Config } from '../../config';
import { FsBatchRepository } from '../../infrastructure/repositories/fsBatchRepository';
import { Batch, BatchStatus, BatchType, Task, TaskStatus } from '../../core/entities/batch';

describe('FsBatchRepository', () => {
  let root: string;
  let repository: FsBatchRepository;
  const batchDetail = { name: 'batch-1', type: BatchType.Index };

  beforeEach(async () => {
    root = await fs.mkdtemp(path.join(os.tmpdir(), 'tabularium-batch-test-'));
    (Config as unknown as { processingDir: string }).processingDir = root;
    repository = new FsBatchRepository();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  function makeTask(id: string, status = TaskStatus.Queued): Task {
    return { id, name: `${id}.pdf`, batch: batchDetail, status, sessionId: null };
  }

  it('creates batch and task directories with initial task versions', async () => {
    const batch: Batch = { detail: batchDetail, status: BatchStatus.None, items: [makeTask('task-1'), makeTask('task-2')] };

    await repository.createBatch(batch);

    await expect(repository.getTask(BatchType.Index, 'batch-1', 'task-1')).resolves.toEqual(batch.items[0]);
    await expect(repository.getTask(BatchType.Index, 'batch-1', 'task-2')).resolves.toEqual(batch.items[1]);
  });

  it('writes batch status versions and returns the latest status', async () => {
    await fs.mkdir(path.join(root, 'batches', 'index', 'batch-1'), { recursive: true });

    await repository.setBatchStatus(batchDetail, BatchStatus.Pending);
    await repository.setBatchStatus(batchDetail, BatchStatus.Finalized);

    await expect(repository.getBatchStatus(batchDetail)).resolves.toBe(BatchStatus.Finalized);
    const files = await fs.readdir(path.join(root, 'batches', 'index', 'batch-1'));
    expect(files.sort()).toEqual(['data.finalized.v#2.json', 'data.pending.v#1.json']);
  });

  it('returns None for a batch directory without status versions', async () => {
    await fs.mkdir(path.join(root, 'batches', 'index', 'batch-1'), { recursive: true });

    await expect(repository.getBatchStatus(batchDetail)).resolves.toBe(BatchStatus.None);
  });

  it('aggregates task statuses into a batch report', async () => {
    await repository.createBatch({
      detail: batchDetail,
      status: BatchStatus.Pending,
      items: [makeTask('task-1'), makeTask('task-2'), makeTask('task-3')],
    });
    await repository.setTaskStatus(makeTask('task-1'), TaskStatus.Success);
    await repository.setTaskStatus(makeTask('task-3'), TaskStatus.Success);

    await expect(repository.getBatchReport(batchDetail)).resolves.toEqual({
      batch: batchDetail,
      items: [
        { status: TaskStatus.Success, count: 2 },
        { status: TaskStatus.Queued, count: 1 },
      ],
    });
  });

  it('returns null for a missing task and rejects status updates without an initial version', async () => {
    await fs.mkdir(path.join(root, 'batches', 'index', 'batch-1', 'tasks', 'new-task'), { recursive: true });

    await expect(repository.getTask(BatchType.Index, 'batch-1', 'missing')).resolves.toBeNull();
    await expect(repository.setTaskStatus(makeTask('new-task'), TaskStatus.Sent))
      .rejects.toThrow('Failed to determine the last version for task new-task');
  });

  it('allows the repository batch finalizer to complete', async () => {
    await expect(repository.finalizeBatch()).resolves.toBeUndefined();
  });

  it('stores and retrieves task session markers', async () => {
    await repository.createBatch({ detail: batchDetail, status: BatchStatus.Pending, items: [makeTask('task-1')] });

    await expect(repository.getTaskSession(BatchType.Index, 'batch-1', 'task-1')).resolves.toBeNull();
    await repository.setTaskSession(BatchType.Index, 'batch-1', 'task-1', 'session-1');
    await expect(repository.getTaskSession(BatchType.Index, 'batch-1', 'task-1')).resolves.toBe('session.session-1.json');
  });

  it('creates an empty report for batches with tasks lacking version records', async () => {
    const tasksRoot = path.join(root, 'batches', 'index', 'batch-1', 'tasks');
    await fs.mkdir(path.join(tasksRoot, 'task-1'), { recursive: true });
    await fs.writeFile(path.join(tasksRoot, 'task-1', 'not-a-version.txt'), 'ignored');

    await expect(repository.getBatchReport(batchDetail)).resolves.toEqual({ batch: batchDetail, items: [] });
  });

  it('rethrows filesystem errors other than a missing directory', async () => {
    const readdir = jest.spyOn(fsSync, 'readdirSync').mockImplementationOnce(() => {
      throw Object.assign(new Error('permission denied'), { code: 'EACCES' });
    });

    await expect(repository.getBatchStatus(batchDetail)).rejects.toThrow('permission denied');
    readdir.mockRestore();
  });
});