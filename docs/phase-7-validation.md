# Phase 7 request validation

Phase 7 adds Zod validation middleware for all write request bodies:

- Diary create/update
- Topic create/update
- Resource create/update
- Journal prompt create/update
- Newsletter subscription

Validation runs in the route before the controller. Schemas are strict, so
unknown fields are rejected and values are trimmed/coerced only where the
schema explicitly allows it. Invalid input returns `400` with field-level
details:

```json
{
  "status": "error",
  "message": "Request validation failed.",
  "details": [
    { "field": "email", "message": "must be a valid email address" }
  ]
}
```

## Examples

Valid diary creation:

```json
{
  "slug": "my-growth-story",
  "title": "My Growth Story",
  "excerpt": "A short summary.",
  "content": "The article body.",
  "status": "DRAFT"
}
```

Invalid diary creation:

```json
{
  "slug": "",
  "title": "Missing content"
}
```

This returns `400` with details for the empty slug and missing excerpt/content.

Valid newsletter subscription:

```json
{ "email": "person@example.com" }
```

Invalid newsletter subscription:

```json
{ "email": "not-an-email" }
```

## Request flow

```text
Request
  ↓
Zod validation middleware
  ↓
Controller (HTTP concerns)
  ↓
Service (business logic)
  ↓
Prisma
  ↓
PostgreSQL
```

The controller receives parsed data from the middleware and does not repeat
body validation. Path and query validation remains in the shared content
validation helpers.
