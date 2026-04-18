# AI Agent Core Documentation

<p align="center">
  <img src="./ai_core.png" alt="AI Agent Core logo" width="220" />
</p>

This folder contains the public API documentation for the AI Agent Core service, plus the basic steps needed to clone, configure, run, and test the project locally.

## Overview

This service is a TypeScript + Express API that exposes offcial records processing workflows.
The server starts on port `3000` by default.

## Prerequisites

Before running the project, make sure you have:

- Node.js 18+ recommended
- npm installed
- access to the downstream service URLs used by the agent
- a valid `.env` file in the project root

## Git / Repository Setup

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd ai_agent_core
npm install
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
CALLBACK_URL=http://localhost:3000
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

## Public Endpoints

### Upload-based workflows
- [`index.md`](./index.md) — `POST /index`
- [`provision.md`](./provision.md) — `POST /provision`
- [`autoredact.md`](./autoredact.md) — `POST /autoredact`
- [`autorecord.md`](./autorecord.md) — `POST /autorecord`

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


