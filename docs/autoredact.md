# `POST /autoredact`

Starts the auto-redaction workflow.

## Request

- **Method:** `POST`
- **Path:** `/autoredact`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document
- `choice`: JSON string with `items`

### Example

> Base URL should use `<AGENT_PUBLIC_URL>`.

```bash
curl -X POST "<AGENT_PUBLIC_URL>/autoredact" \
  -F "file=@./sample.pdf;type=application/pdf" \
  -F "choice={\"items\":[{\"service\":\"Recognition\",\"level\":6},{\"service\":\"Redact\",\"level\":1}]}"
```

## Success response

```json
{
  "session": "<session-id>"
}
```

## Errors

- `400 Invalid request: no file uploaded or unsupported file type`
- `400 Invalid request: valid Choice is required in 'choice' field`
- `404` if upstream resources are missing
- `500` for internal failures

## Related guide
- `../AUTOREDACT_USER_GUIDE.md`
