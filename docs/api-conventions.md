# API conventions

## Versioning

Application endpoints are grouped under `/api/v1`. System endpoints remain at
the root level:

- `GET /health` checks process liveness.
- `GET /ready` checks database readiness.

## Success responses

Resource and collection responses use a `data` plus `meta` envelope:

```json
{
  "data": [],
  "meta": {
    "request_id": "req-123"
  }
}
```

Collection endpoints should add `page`, `page_size`, and `total` when pagination
is introduced.

## Error responses

Errors use a stable machine-readable code and a safe client-facing message:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested resource does not exist.",
    "details": null
  },
  "meta": {
    "request_id": "req-123"
  }
}
```

Validation errors use `VALIDATION_ERROR`; unexpected failures use
`INTERNAL_ERROR`. Internal exception details are logged, not returned to the
client.

## Request IDs

Clients may send `X-Request-ID`. If omitted, the API generates one. The value
is returned in the response header and in the response envelope metadata.
