# Architecture and development

## Code map

| Location | Responsibility |
| --- | --- |
| `src/server.ts` | Executable entry point; calls `startServer()` |
| `src/index.ts` | Registers controllers, builds Express apps, starts HTTP and processors |
| `src/config.ts` | Loads `.env` and validates configuration at import time |
| `src/di/container.ts` | Binds interface tokens to concrete TypeDI services |
| `src/api/controllers` | Upload, session, callback, and batch HTTP adapters |
| `src/api/utils` | Shared error mapping and callback query validation |
| `src/application/useCases` | Workflow initiation and callback continuation |
| `src/application/processors` | In-memory batch queues and task lifecycle |
| `src/core/entities` | Workflow, callback, content, and batch contracts; default choices |
| `src/core/interfaces` | Client, storage, integration, and tracking interfaces |
| `src/infrastructure/aiclients` | Downstream HTTP clients and mock client |
| `src/infrastructure/repositories` | Azure batch content and local batch state |
| `src/infrastructure/services` | Blob access, signing, integration, tracking, and shared indexing |
| `src/tests` | Jest tests grouped by application layer |

## Request lifecycle

Upload controllers read the multipart `file` field, map its MIME type, and invoke
a use case with an internal choice profile from `core/entities/choices`.
`IndexService` creates a downstream session, obtains its storage token, uploads
the document, and submits indexing with a signed callback URL. The returned
session ID identifies work that continues asynchronously.

Callback controllers validate the signature and status before invoking a callback
use case. Use cases fetch result blobs and either start the next stage or deliver
results through `IIntegrationService`. Provision chains indexing and calculation;
auto-redaction chains indexing and redaction; auto-record chains indexing,
calculation, recording metadata, and endorsement. Session endpoints start stages
against an existing session. See [callbacks](callbacks.md) for the wire contract.

## Dependency injection and integration

`setupContainer()` selects real API clients, `AzureBlobService`,
`AzureBatchSourceRepository`, `FsBatchRepository`, `ConsoleLogger`,
`DemoTrackingService`, and `DemoBatchIntegrationService`. Despite its name, the
batch integration service writes results: ordinary workflow outputs go under
`mock-data/<session>/<workflow>/`, while batch index/redaction outputs go to Azure
and finalize processor tasks. Its `record()` implementation generates a random
three-digit record number and a current timestamp.

To integrate an application's persistence or record assignment, implement
`IIntegrationService` and change its binding in `setupContainer()`. Interface
tokens live in `core/tokens.ts`. Mock clients and blob services require explicit
bindings; setting placeholder URLs does not enable an offline mode.

## Application lifecycle

`createApp()` registers routes without opening a port or starting processors.
For embedded use, initialize the container and call routing-controllers'
`useContainer(Container)` before serving requests. Importing `src/index.ts` also
creates an exported `app`, but does not listen; `startServer()` creates its own app.
Imports still load configuration, so environment values must already be available.

`startServer()` returns the HTTP server and starts both processors without awaiting
their long-running promises. `TaskProcessor.processTasks()` resolves only when
the loop exits. `stopProcessing()` requests exit after the current iteration;
closing the HTTP server alone does not stop these loops. No signal-based shutdown
handler or persisted-queue recovery is currently installed.

## Validation and tests

From the repository root:

```sh
npm run build
npm test -- --runInBand
npm run test:coverage
```

TypeScript builds production sources into `dist/` and excludes `src/tests`.
Jest uses `ts-jest`; API tests exercise controllers, application tests cover
workflow and processor behavior, and infrastructure tests mock external services.
These tests do not prove connectivity to a deployed downstream service or Azure.
For configuration or container changes, check the corresponding tests under
`src/tests/config.test.ts` and `src/tests/di` as well as affected workflow tests.
