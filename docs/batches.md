# Batch processing

## Start a batch

| Route | Input prefix | Output prefix | Workflow |
| --- | --- | --- | --- |
| `POST /batch/index/:batch` | `BATCH_INDEX_IN` | `BATCH_INDEX_OUT` | Index |
| `POST /batch/redact/:batch` | `BATCH_REDACT_IN` | `BATCH_REDACT_OUT` | Index, then auto-redact |

The `batch` path parameter names an existing group of blobs in `BATCH_CONTAINER`.
No request body is needed. For example, with `BATCH_INDEX_IN=index/in`, upload
documents under `index/in/example-batch/` before calling:

```sh
curl -X POST "<AGENT_PUBLIC_URL>/batch/index/example-batch"
```

Success is HTTP 200 with `{}` after local task creation and enqueueing, before
document processing completes. There is no batch status HTTP endpoint. An empty
or missing input prefix currently produces HTTP 500 with
`{"error":"Internal server error"}` for both routes: the index use case throws
routing-controllers' `NotFoundError`, which the shared helper does not recognize
as the application's own `NotFoundError`.

The repository lists every blob beneath `<input-prefix>/<batch>/`, including
nested paths, with no extension filter. Blob Content-Type determines the document
type; the mapper accepts `application/pdf`, `image/tiff`, and `application/json`.
Downstream support is separate from MIME mapping. Keep outputs and unrelated
blobs outside input prefixes.

## Task lifecycle

Each processor has a separate in-memory queue, with a limit of 20 combined `sent`
and `pending` tasks. Each loop submits at most one queued task, then waits one
second. Limits and timeout values are constants in `TaskProcessor`.

| State | Meaning |
| --- | --- |
| `queued` | Waiting for submission |
| `sent` | Index submission returned; batch session registration is not complete |
| `pending` | Session registered and local session marker written; awaiting callback |
| `success` | Integration saved a result and finalized the task |
| `failed` | Integration finalized the task with an error |
| `rejected` | Submission or registration failed |
| `deferred` | A pending task exceeded 600 seconds since its last state update |

Submission creates a session, uploads content, and starts indexing. The processor
then registers `{ "name": "<session>", "batch": "<batch>" }` at
`BATCH_URL/subscription/SUBSCRIPTION/batches/sessions/new` using the API key as a
Bearer token. Callbacks carry `sn`, `bt`, and `tk` to correlate results.

Terminal tasks leave the queue. When no tasks for a batch remain in that
processor, it marks the batch `finalized` and writes
`<output-prefix>/<batch>/report.json` with counts by status:

```json
{
  "batch": { "name": "example-batch", "type": "index" },
  "items": [{ "status": "success", "count": 2 }]
}
```

Finalized does not mean every task succeeded. Index results use the original
input item name with JSON content, so a blob named `document.pdf` can contain
JSON in the index output prefix. Redaction results also retain input item names.

## Persistence and operational limits

`FsBatchRepository` writes append-only snapshots beneath:

```text
PROCESSING_DIR/batches/<index|redact>/<batch>/
  data.<batch-status>.v#<version>.json
  tasks/<task-id>/
    data.<task-status>.v#<version>.json
    session.<session-id>.json
```

The highest numeric version determines the current persisted status. These files
support reports and task lookup, but startup does not reload them into queues.
Restarting the process loses queued work and in-memory callback correlation.
There is no automatic retry for rejected, failed, or deferred tasks, and a late
callback can fail task lookup after a deferred task has left the queue.

Submitting the same batch again creates new task IDs without deduplicating earlier
work. Existing task files contribute to reports, and output blobs may be
overwritten. The queue lock is local to one processor instance; the implementation
does not coordinate multiple server processes sharing a processing directory.
