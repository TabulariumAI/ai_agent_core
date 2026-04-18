# `POST /autoredact`

Starts the auto-redaction workflow.

## Request

- **Method:** `POST`
- **Path:** `/autoredact`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document

> Base URL should use `<AGENT_PUBLIC_URL>`.
>
> No `choice` payload is required. The API uses an internal auto-redaction profile.

### Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/autoredact" \
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
