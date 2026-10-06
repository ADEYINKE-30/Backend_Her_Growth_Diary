# Phase 9 authorization

Phase 9 separates authentication from authorization:

- **Authentication** answers: “Who are you?” The session middleware validates
  the administrator session and attaches the authenticated identity to the
  request.
- **Authorization** answers: “What are you allowed to do?” The role middleware
  checks the authenticated identity before the handler runs.

## Access policy

Public visitors can:

- Read published diary articles.
- Read topics.
- Read published resources.
- Read published journal prompts.
- Subscribe to the newsletter.

Only an authenticated `ADMIN` can:

- Create, update, or delete diary articles.
- Create, update, or delete topics.
- Create, update, or delete resources.
- Create, update, or delete journal prompts.
- View newsletter subscribers through `GET /api/newsletter/subscribers`.

An authenticated `EDITOR` is recognized by authentication but does not have
permission for these Phase 9 administrator-only operations and receives `403`.
Unauthenticated requests receive `401`.

## Middleware flow

```text
Request
  ↓
Session authentication (`requireAdmin`)
  ↓
Role authorization (`requireAdministrator`)
  ↓
CSRF protection for cookie mutations
  ↓
Zod request validation
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL
```

Knowing an endpoint URL is not sufficient: protected routes stop at
authentication or authorization middleware and never invoke their controllers
or services.

Diary public GET queries now filter to `PUBLISHED` posts only. Password hashes,
session tokens, and other credential material are not returned.
