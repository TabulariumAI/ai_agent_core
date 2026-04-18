# `POST /provision`

Starts the provisioning workflow for an uploaded document.

## Request

- **Method:** `POST`
- **Path:** `/provision`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document

> No `choice` payload is required. The service now applies the provisioning profile automatically.

### Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/provision" \
  -F "file=@./sample.tiff;type=image/tiff"
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
