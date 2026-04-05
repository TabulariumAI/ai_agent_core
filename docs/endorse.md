# `POST /endorse/:session/`

Runs endorsement for an existing session.

## Request

- **Method:** `POST`
- **Path:** `/endorse/:session/`
- **Content-Type:** `application/json`

### Path parameters
- `session`: workflow session ID

### Body
A valid metadata payload is required.

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
curl -X POST "<AGENT_PUBLIC_URL>/endorse/test-session/" \
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
