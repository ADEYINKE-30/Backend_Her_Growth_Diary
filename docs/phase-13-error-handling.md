# Phase 13: Consistent backend error handling

The API uses `errorHandler` as the final Express middleware. Controllers and
middleware pass failures to it with `next(error)`; the handler converts known
application, validation, authentication, authorization, upload, and Prisma
errors into one response shape:

```json
{
  "status": "error",
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed.",
  "details": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

`details` is omitted when there are no safe field-level details. Route misses
use `ROUTE_NOT_FOUND`. Unknown failures use `INTERNAL_SERVER_ERROR`; their
message is intentionally generic, and stack traces are never sent to clients.
Database constraint and connectivity failures are mapped centrally, while
services may still translate a database error when a more useful,
resource-specific message is safe (for example, a duplicate diary slug).

## Error categories

- **Operational errors** are expected failures caused by a request or a
  temporarily unavailable dependency: an expired session, a missing resource,
  a duplicate slug, an invalid upload, or a database outage. They have a safe
  HTTP status and message and are returned to the client.
- **Validation errors** are a subtype of operational error. They mean the
  request shape or values do not satisfy the API contract. They use
  `VALIDATION_ERROR` (or a safe request-specific code) and may include
  field-level details.
- **Programming errors** are unexpected defects such as an invalid invariant,
  an uncaught exception, or a bug in application code. They are logged
  server-side and returned as the generic `INTERNAL_SERVER_ERROR` response,
  especially in production. Password hashes, credentials, stack traces, and
  implementation details are never included.

## Example request flow

For `POST /api/admin/login` with malformed JSON:

1. `express.json()` rejects the body with a `SyntaxError`.
2. Express forwards the error to `errorHandler` after the route stack.
3. The middleware identifies the parser error and sends HTTP `400`:

```json
{
  "status": "error",
  "code": "INVALID_JSON",
  "message": "Request body must contain valid JSON."
}
```

For valid JSON with an invalid login payload, `validateBody` creates a
`ValidationError`; for a valid payload with wrong credentials,
`loginAdmin` creates an authentication error response. In both cases the
password and password hash remain excluded.
