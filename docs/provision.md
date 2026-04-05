# `POST /provision`

Starts the provisioning workflow for an uploaded document.

## Request

- **Method:** `POST`
- **Path:** `/provision`
- **Content-Type:** `multipart/form-data`

### Form fields
- `file`: uploaded document
- `choice`: JSON string with `items`

### Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/provision" \
  -F "file=@./sample.tiff;type=image/tiff" \
  -F "choice={\"items\":[{\"service\":\"Provision\",\"level\":1},{\"service\":\"Recognition\",\"level\":3}]}"
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
