# Internal Callback Endpoints

These callback routes are intended for **service-to-service communication**, not direct end-user access.

## Base pattern

- Query parameter: `sn=<session-id>`
- Batch callbacks also include `bt=<batch-name>&tk=<task-id>`; both are required together.
- Header: `Authorization: <signed-token>`
- JSON body uses `status`, `data`, and optional string `types`.

Typical body:

```json
{
  "status": "completed",
  "data": "<blob-url-or-payload-reference>"
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

## Signing and validation

Clients receive `callback_url` and `callback_token` in the downstream request.
Send that token unchanged in `Authorization`, without a `Bearer` prefix. Its
format is `exp=<unix-seconds>&sig=<hex-hmac-sha256>`, with a one-hour lifetime.

The signed data is the callback identifier and canonical session query, for
example `index?sn=<session>` or
`autoredact/index?sn=<session>&bt=<batch>&tk=<task>`. It excludes the host and
`/callback/` prefix. The signature covers `<signed-data>&exp=<unix-seconds>` using
`TOKEN_SECRET`. Controllers reconstruct the query in `sn`, `bt`, `tk` order via
`SessionCallbackData.getPath()`; this helper does not URL-encode identifiers.

- `status` accepts `completed`, `error`, or `processing`.
- `completed` supplies a result reference in `data`; document-result callbacks
  also use `types` (for example `RedactPdf`) to select content to download.
- `error` passes failure information through the workflow's error handling.
- `processing` is acknowledged without completing the workflow.
- An invalid or expired token returns `401` with `{"error":"Invalid token"}`.
- A missing or unknown status returns `400` with
  `{"error":"Callback data is invalid or missing status"}`.
- Exceptions escaping the callback action return `500` with
  `{"error":"Internal server error"}`.

The shared helper validates the token and status; it does not fully validate
`data` or `types`. Workflow use cases handle missing or unreadable result data.
A successfully handled callback returns HTTP 200 with `{}`, including handled
workflow errors; the HTTP response alone does not establish workflow success.
