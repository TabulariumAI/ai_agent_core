# Internal Callback Endpoints

These callback routes are intended for **service-to-service communication**, not direct end-user access.

## Base pattern

- Query parameter: `sn=<session-id>`
- Header: `Authorization: <signed-token>`
- Body must include callback status and payload reference

Typical body:

```json
{
  "status": "completed",
  "data": "<blob-url-or-payload-reference>",
  "type": 0
}
```

## Standard callbacks
- `POST /callback/index?sn=<session>`
- `POST /callback/calc?sn=<session>`
- `POST /callback/redact?sn=<session>`
- `POST /callback/endorse?sn=<session>`
- `POST /callback/reprocess?sn=<session>`

## Provision callbacks
- `POST /callback/provision/index?sn=<session>`
- `POST /callback/provision/calc?sn=<session>`

## AutoRedact callbacks
- `POST /callback/autoredact/index?sn=<session>`
- `POST /callback/autoredact/redact?sn=<session>`

## AutoRecord callbacks
- `POST /callback/autorecord/index?sn=<session>`
- `POST /callback/autorecord/calc?sn=<session>`
- `POST /callback/autorecord/endorse?sn=<session>`

## Validation rules
- `status` must be `completed`
- `Authorization` token must be valid for the exact callback path and query
- invalid token returns `401`
- invalid callback payload returns `400`
