import 'reflect-metadata';

import { TaskProcessor } from '../../application/processors/taskProcessor';
import { RedactTaskProcessor } from '../../application/processors/redactTaskProcessor';
import { BatchType, Task, TaskStatus } from '../../core/entities/batch';
import { Callback, Workflow, Step } from '../../core/entities/imports';

class TestTaskProcessor extends TaskProcessor {
  protected indexCallback = Callback.INDEX;
  protected batchType = BatchType.Index;
  protected context = { workflow: Workflow.INDEX, step: Step.INDEX };
  protected reportRoot = 'index-out';
  protected batchInRoot = 'index-in';
  protected choice = { items: [{ service: 'Indexing', level: 1 }] };
  protected batchRepository: any;
  protected batchSourceRepository: any;
  protected batchClient: any;
  protected indexService: any;
  protected logger: any;

  constructor(private readonly dependencies: Record<string, any>) {
    super();
    this.batchRepository = dependencies.batchRepository;
    this.batchSourceRepository = dependencies.batchSourceRepository;
    this.batchClient = dependencies.batchClient;
    this.indexService = dependencies.indexService;
    this.logger = dependencies.logger;
  }
}

describe('TaskProcessor', () => {
  let dependencies: Record<string, any>;
  let processor: TestTaskProcessor;

  function makeTask(id: string, status = TaskStatus.Queued): Task {
    return {
      id,
      name: `${id}.pdf`,
      batch: { name: 'batch-1', type: BatchType.Index },
      status,
      sessionId: null,
    };
  }

  beforeEach(() => {
    dependencies = {
      batchRepository: {
        setTaskStatus: jest.fn().mockResolvedValue(undefined),
        setBatchStatus: jest.fn().mockResolvedValue(undefined),
        getBatchReport: jest.fn().mockResolvedValue({ batch: { name: 'batch-1', type: BatchType.Index }, items: [] }),
        setTaskSession: jest.fn().mockResolvedValue(undefined),
      },
      batchSourceRepository: {
        getContent: jest.fn().mockResolvedValue({ documentType: 'pdf', data: Buffer.from('document') }),
        setReport: jest.fn().mockResolvedValue(undefined),
      },
      batchClient: { createSession: jest.fn().mockResolvedValue(undefined) },
      indexService: { index: jest.fn().mockResolvedValue('session-1') },
      logger: { info: jest.fn(), error: jest.fn() },
    };
    processor = new TestTaskProcessor(dependencies);
  });

  afterEach(() => {
    processor.stopProcessing();
    jest.useRealTimers();
  });

  it('finalizes the batch after the last task succeeds', async () => {
    const task = makeTask('task-1');
    await processor.addTasks([task]);

    await processor.finalizeTaskSuccess(task.id);

    expect(dependencies.batchRepository.setTaskStatus).toHaveBeenCalledWith(task, TaskStatus.Success);
    expect(dependencies.batchRepository.setBatchStatus).toHaveBeenCalledWith(
      { name: 'batch-1', type: BatchType.Index },
      'finalized',
    );
    expect(dependencies.batchSourceRepository.setReport).toHaveBeenCalledWith(
      'index-out',
      'batch-1',
      { batch: { name: 'batch-1', type: BatchType.Index }, items: [] },
    );
  });

  it('does not finalize a batch while another active task remains', async () => {
    const first = makeTask('task-1');
    const second = makeTask('task-2');
    await processor.addTasks([first, second]);

    await processor.finalizeTaskFailure(first.id, 'failed');

    expect(dependencies.batchRepository.setTaskStatus).toHaveBeenCalledWith(first, TaskStatus.Failed);
    expect(dependencies.batchRepository.setBatchStatus).not.toHaveBeenCalled();
  });

  it('reports attempts to finalize tasks that are not queued', async () => {
    await expect(processor.finalizeTaskSuccess('missing-task')).rejects.toThrow(
      'Task with taskId missing-task not found in processing tasks.',
    );
    await expect(processor.finalizeTaskFailure('missing-task', 'failed')).rejects.toThrow(
      'Task with taskId missing-task not found in processing tasks.',
    );
    expect(dependencies.logger.error).toHaveBeenCalledTimes(2);
  });

  it('ignores status updates for tasks absent from the queue', async () => {
    await expect(processor.updateTaskStatus('missing-task', TaskStatus.Sent)).resolves.toBeUndefined();
    expect(dependencies.batchRepository.setTaskStatus).not.toHaveBeenCalled();
  });

  it('removes terminal tasks while retaining queued, sent, and pending tasks', async () => {
    const activeTasks = [makeTask('queued'), makeTask('sent', TaskStatus.Sent), makeTask('pending', TaskStatus.Pending)];
    const terminalTasks = [makeTask('success', TaskStatus.Success), makeTask('failed', TaskStatus.Failed)];
    await processor.addTasks([...activeTasks, ...terminalTasks]);

    await processor.filterTasks();

    await expect(processor.finalizeTaskSuccess('success')).rejects.toThrow('Task with taskId success not found in processing tasks.');
    expect(dependencies.batchRepository.setBatchStatus).not.toHaveBeenCalled();
  });

  it('processes task content and creates its session with task callback data', async () => {
    const task = makeTask('task-1');
    await processor.addTasks([task]);

    await processor.processTask(task);

    expect(dependencies.batchSourceRepository.getContent).toHaveBeenCalledWith('index-in', 'batch-1', 'task-1.pdf');
    expect(dependencies.indexService.index).toHaveBeenCalledWith(
      { workflow: Workflow.INDEX, step: Step.INDEX },
      'pdf',
      expect.any(Object),
      [{ service: 'Indexing', level: 1 }],
      Callback.INDEX,
      { id: 'task-1', batch: 'batch-1' },
    );
    expect(dependencies.batchClient.createSession).toHaveBeenCalledWith('session-1', 'batch-1');
    expect(dependencies.batchRepository.setTaskSession).toHaveBeenCalledWith(BatchType.Index, 'batch-1', 'task-1', 'session-1');
    expect(dependencies.batchRepository.setTaskStatus).toHaveBeenNthCalledWith(1, task, TaskStatus.Sent);
    expect(dependencies.batchRepository.setTaskStatus).toHaveBeenNthCalledWith(2, task, TaskStatus.Pending);
  });

  it('fails task processing when the source content is missing', async () => {
    dependencies.batchSourceRepository.getContent.mockResolvedValue(null);

    await expect(processor.processTask(makeTask('missing-content')))
      .rejects.toThrow('Content not found for task missing-content');
    expect(dependencies.indexService.index).not.toHaveBeenCalled();
  });

  it('dispatches redaction tasks to the auto-redact callback', async () => {
    const redact = new RedactTaskProcessor(
      dependencies.batchRepository, dependencies.batchSourceRepository,
      dependencies.batchClient, dependencies.indexService, dependencies.logger,
    );
    const task = { ...makeTask('redact-task'), batch: { name: 'batch-1', type: BatchType.Redact } };
    await redact.addTasks([task]);
    await redact.processTask(task);
    expect(dependencies.indexService.index.mock.calls[0][4]).toBe(Callback.AUTOREDACT_INDEX);
  });

  it('polls the queue and dispatches queued work until stopped', async () => {
    jest.useFakeTimers();
    await processor.addTasks([makeTask('task-1')]);
    const loop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.batchSourceRepository.getContent).toHaveBeenCalledWith('index-in', 'batch-1', 'task-1.pdf');

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await loop;
  });

  it('does not start a second polling loop when already running', async () => {
    jest.useFakeTimers();
    await processor.addTasks([makeTask('task-1')]);
    const firstLoop = processor.processTasks();
    const secondLoop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.batchSourceRepository.getContent).toHaveBeenCalledTimes(1);

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await Promise.all([firstLoop, secondLoop]);
  });

  it('respects the concurrent sent and pending task limit', async () => {
    jest.useFakeTimers();
    await processor.addTasks([
      makeTask('sent-1', TaskStatus.Sent),
      ...Array.from({ length: 19 }, (_, index) => makeTask(`pending-${index}`, TaskStatus.Pending)),
      makeTask('queued-1'),
    ]);
    const loop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.batchSourceRepository.getContent).not.toHaveBeenCalled();

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await loop;
  });

  it('dispatches queued work when active sent and pending tasks remain below the limit', async () => {
    jest.useFakeTimers();
    await processor.addTasks([
      makeTask('sent-1', TaskStatus.Sent),
      makeTask('pending-1', TaskStatus.Pending),
      makeTask('queued-1'),
    ]);
    const loop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.batchSourceRepository.getContent).toHaveBeenCalledWith('index-in', 'batch-1', 'queued-1.pdf');

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await loop;
  });

  it('keeps queued tasks waiting when unsorted active tasks fill the limit', async () => {
    jest.useFakeTimers();
    await processor.addTasks([
      makeTask('sent-b', TaskStatus.Sent),
      makeTask('sent-a', TaskStatus.Sent),
      makeTask('pending-b', TaskStatus.Pending),
      makeTask('pending-a', TaskStatus.Pending),
      ...Array.from({ length: 16 }, (_, index) => makeTask(`pending-extra-${index}`, TaskStatus.Pending)),
      makeTask('queued-b'),
      makeTask('queued-a'),
    ]);
    const loop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.batchSourceRepository.getContent).not.toHaveBeenCalled();

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await loop;
  });

  it('dispatches the queued task with the lexically smallest id', async () => {
    jest.useFakeTimers();
    await processor.addTasks([makeTask('task-b'), makeTask('task-a')]);
    const loop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.batchSourceRepository.getContent).toHaveBeenCalledWith('index-in', 'batch-1', 'task-a.pdf');

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await loop;
  });

  it('defers pending tasks that exceed the callback timeout', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(Date.parse('2026-01-01T00:00:00Z'));
    const task = makeTask('stale-task', TaskStatus.Pending);
    await processor.addTasks([task]);
    jest.setSystemTime(Date.parse('2026-01-01T00:11:00Z'));
    const loop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.batchRepository.setTaskStatus).toHaveBeenCalledWith(task, TaskStatus.Deferred);
    expect(dependencies.batchRepository.setBatchStatus).toHaveBeenCalledWith(
      { name: 'batch-1', type: BatchType.Index },
      'finalized',
    );

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await loop;
  });

  it('marks a queued task rejected when processing fails', async () => {
    jest.useFakeTimers();
    const task = makeTask('task-1');
    dependencies.batchSourceRepository.getContent.mockResolvedValue(null);
    await processor.addTasks([task]);
    const loop = processor.processTasks();

    await jest.advanceTimersByTimeAsync(0);
    expect(dependencies.logger.error).toHaveBeenCalledWith('Error executing task task-1: Content not found for task task-1');
    expect(dependencies.batchRepository.setTaskStatus).toHaveBeenCalledWith(task, TaskStatus.Rejected);
    expect(dependencies.batchRepository.setBatchStatus).toHaveBeenCalledWith(task.batch, 'finalized');
    expect(dependencies.batchSourceRepository.setReport).toHaveBeenCalledTimes(1);

    processor.stopProcessing();
    await jest.advanceTimersByTimeAsync(1000);
    await loop;
  });
});
