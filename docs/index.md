# `POST /index`

Starts the indexing workflow for an uploaded PDF or TIFF document.

## Request

- **Method:** `POST`
- **Path:** `/index`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document
- `choice`: JSON string with `items`

### Supported file types
- `application/pdf`
- `image/tiff`

### `choice` example
```json
{
  "items": [
    { "service": "Recognition", "level": 3 }
  ]
}
```

## Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/index" \
  -F "file=@./sample.pdf;type=application/pdf" \
  -F "choice={\"items\":[{\"service\":\"Recognition\",\"level\":3}]}"
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
