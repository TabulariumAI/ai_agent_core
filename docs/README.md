# AI Agent Core Documentation

<p align="center">
  <img src="./ai_core.png" alt="AI Agent Core logo" width="220" />
</p>

This folder contains the public API documentation for the AI Agent Core service, plus the basic steps needed to clone, configure, run, and test the project locally.

## Overview

This service is a TypeScript + Express API that exposes official records processing workflows.
The server starts on port `3000` by default.

## Prerequisites

Before running the project, make sure you have:

- Node.js 20 or newer (the locked Azure dependencies require Node.js >=20)
- npm installed
- access to the downstream service URLs used by the agent
- a valid `.env` file in the project root

## Git / Repository Setup

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd ai_agent_core
npm ci
```

### Recommended daily Git workflow

```bash
git checkout -b feature/your-change
git status
git add .
git commit -m "Describe your change"
git push -u origin feature/your-change
```

Useful Git commands:

```bash
git pull
git log --oneline --decorate -n 10
git diff
git branch
```

## Environment Configuration

Create a `.env` file in the repository root. The application expects the following values:

```env
API_KEY=your_api_key
CALLBACK_URL=http://localhost:3000/callback
BATCH_URL=https://your-batch-service
BATCH_CONTAINER=https://your-account.blob.core.windows.net/your-container?<sas-token>
BATCH_INDEX_IN=index/in
BATCH_INDEX_OUT=index/out
BATCH_REDACT_IN=redact/in
BATCH_REDACT_OUT=redact/out
PROCESSING_DIR=./processing
SESSION_URL=https://your-session-service
COMPUTE_URL=https://your-compute-service
INDEX_URL=https://your-index-service
FEEDBACK_URL=https://your-feedback-service
RECORD_URL=https://your-record-service
REDACT_URL=https://your-redact-service
REPROCESS_URL=https://your-reprocess-service
TOKEN_SECRET=change_me

# Optional
RECORD_FORMAT=
REDACT_FORMAT=
```

If a required value is missing, the service will fail during startup.

`Config` reads these values when its module is imported and removes one trailing
slash. All values above except `TOKEN_SECRET`, `RECORD_FORMAT`, and `REDACT_FORMAT`
are required, including batch settings when only using upload endpoints.
`TOKEN_SECRET` currently falls back to `default_secret`; set an explicit private
value for callback signing. Optional formats default to an empty string.

`BATCH_CONTAINER` is an Azure container URL, typically including a SAS granting
list/read access to inputs and write access to outputs. It is passed directly to
`ContainerClient`, not interpreted as a connection string. Batch roots are blob
prefixes within that container. `PROCESSING_DIR` is a writable local directory;
relative paths resolve from the process working directory. The batch subscription
is derived from the part of `API_KEY` before the first `:`; there is no separate
`SUBSCRIPTION` environment setting.

`CALLBACK_URL` must include `/callback` and be reachable by downstream services.
The localhost example works only when those services can reach this machine at
that address. `FEEDBACK_URL` is required by configuration but currently has no
client call site. The configured API key is sent to downstream services.

## How to Run

### Development mode

```bash
npm run dev
```

### Normal start

```bash
npm start
```

After startup, the API will be available at:

```text
http://localhost:3000
```

`src/server.ts` starts the HTTP server and both batch processors. There is no
`PORT` environment setting; an embedding application can call `startServer(port)`.
After building, use `node dist/server.js` to run the compiled service.

## Build and Test

Build the TypeScript project:

```bash
npm run build
```

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Run the coverage checks with `npm run test:coverage`. Jest currently requires
100% statements, branches, functions, and lines. See the
[development guide](./architecture.md) for test organization and startup behavior.

## Public Endpoints

### Upload-based workflows
- [`index.md`](./index.md) — `POST /index`
- [`provision.md`](./provision.md) — `POST /provision`
- [`autoredact.md`](./autoredact.md) — `POST /autoredact`
- [`autorecord.md`](./autorecord.md) — `POST /autorecord`

> These upload endpoints now use **internal default choice profiles**. Clients only need to send the file in the request.

### Session-based JSON workflows
- [`calc.md`](./calc.md) — `POST /calc/:session`
- [`redact.md`](./redact.md) — `POST /redact/:session`
- [`endorse.md`](./endorse.md) — `POST /endorse/:session/`
- [`reprocess.md`](./reprocess.md) — `POST /reprocess/:session/:segment`

## Shared Notes

- **Base URL:** `<AGENT_PUBLIC_URL>`
- Public endpoint examples should use `<AGENT_PUBLIC_URL>`
- Upload endpoints use `multipart/form-data`
- Session endpoints use `application/json` unless otherwise noted
- Internal callback endpoints are documented in [`callbacks.md`](./callbacks.md)

## Batch processing

- `POST /batch/index/:batch`
- `POST /batch/redact/:batch`

See [batch processing](./batches.md) for input layout, responses, task states,
output reports, and restart limitations.


