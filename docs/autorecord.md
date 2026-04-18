# `POST /autorecord`

Starts the auto-record workflow.

## Request

- **Method:** `POST`
- **Path:** `/autorecord`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document

> No `choice` payload is required. The API now applies the auto-record choice profile internally.

### Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/autorecord" \
  -F "file=@./sample.pdf;type=application/pdf"
```

## Success response

```json
{
  "session": "<session-id>"
}
```

## Errors

- `400 Invalid request: no file uploaded or unsupported file type`
- `404` if upstream resources are missing
- `500` for internal failures

## Related documentation
- See the main docs overview in [README.md](./README.md)
