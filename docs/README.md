# API Endpoint Documentation

This folder contains separate help files for each public API endpoint.

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


