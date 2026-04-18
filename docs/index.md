# `POST /index`

Starts the indexing workflow for an uploaded PDF or TIFF document.

## Request

- **Method:** `POST`
- **Path:** `/index`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document

### Supported file types
- `application/pdf`
- `image/tiff`

> No `choice` payload is required. The service now applies the indexing profile internally.

## Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/index" \
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
