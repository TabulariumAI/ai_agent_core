# `POST /reprocess/:session/:segment`

Reprocesses a specific document segment for an existing session.

## Request

- **Method:** `POST`
- **Path:** `/reprocess/:session/:segment`
- **Content-Type:** none required

### Path parameters
- `session`: workflow session ID
- `segment`: allowed segment name

### Allowed `segment` values
- `endorsement`
- `property`
- `legal`
- `party`
- `reference`
- `monetary`
- `acknowledgment`
- `court`
- `vital`
- `transaction`
- `fiscal`
- `secrets`
- `chain`
- `history`
- `undefined`

## Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/reprocess/test-session/party"
```

## Success response

```json
{}
```

## Errors

- `400 Invalid segment`
- `404` if the session/resource is missing
- `500` for internal failures
