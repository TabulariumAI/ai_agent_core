# `POST /autorecord`

Starts the auto-record workflow.

## Request

- **Method:** `POST`
- **Path:** `/autorecord`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document
- `choice`: JSON string with `items`

### Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/autorecord" \
  -F "file=@./sample.pdf;type=application/pdf" \
  -F "choice={\"items\":[{\"service\":\"Recognition\",\"level\":1},{\"service\":\"Record\",\"level\":1}]}"
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
- `../AUTORECORD_USER_GUIDE.md`
