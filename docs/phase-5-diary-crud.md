# Phase 5 diary CRUD implementation

Phase 5 implemented the `Post` diary CRUD endpoints under `/api/diary` using
the Phase 4 route/controller/service/Prisma boundaries.

## Superseded temporary development/testing exception

Authentication and authorization were deliberately **not implemented** in
Phase 5. That temporary development/testing exception is now superseded by
Phase 9 authorization:

- `GET /api/diary` and `GET /api/diary/:id` return both `DRAFT` and `PUBLISHED`
  posts.
- `POST /api/diary` is unauthenticated and defaults to the schema's `DRAFT`
  status when `status` is omitted; callers may explicitly create `PUBLISHED`
  posts.
- `PATCH /api/diary/:id` and `DELETE /api/diary/:id` are unauthenticated and
  work for either post status.

The current access policy is documented in
`docs/phase-9-authorization.md`; no Phase 5 exception remains active.

## Intended production behavior

Public `GET` diary endpoints now return `PUBLISHED` posts only. `POST`, `PATCH`,
and `DELETE` require an authenticated administrator session.

The implementation supports pagination (`page`, `limit`), optional topic slug
and text search filters, UUID validation, duplicate-slug handling, topic
associations, and consistent JSON error responses.
