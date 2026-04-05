# `POST /calc/:session`

Runs calculation logic for an existing session.

## Request

- **Method:** `POST`
- **Path:** `/calc/:session`
- **Content-Type:** `application/json`

### Path parameters
- `session`: workflow session ID

### Body
Metadata JSON is optional. If omitted or empty, the controller treats it as `null`.

```json
{
  "heading": {
    "title": "Test Document",
    "class": "Test Class",
    "explanation": "Short description"
  },
  "secrets": [],
  "indexes": []
}
```

## Example

```bash
curl -X POST "<AGENT_PUBLIC_URL>/calc/test-session" \
  -H "Content-Type: application/json" \
  -d '{
    "heading": {
      "title": "Test Document",
      "class": "Test Class",
      "explanation": "Short description"
    },
    "secrets": [],
    "indexes": []
  }'
```

## Success response

```json
{}
```

## Errors

- `400 Invalid request: valid MetaData is required`
- `404` if the session/resource is missing
- `500` for internal failures
