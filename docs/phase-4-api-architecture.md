# Her Growth Diary
## Phase 4 REST API Architecture

Date: 2026-10-05

## Scope

This document defines the API contract and application-layer boundaries for the
editorial resources introduced in Phase 3. It is an architecture design only:
CRUD routes, controllers, services, validation, and authentication are not
implemented in this phase.

The API will use JSON over HTTP and will be mounted under `/api`.

## 1. What an API is

An API (Application Programming Interface) is a defined way for one software
system to request data or actions from another. The frontend will call the
backend API instead of reading content directly from PostgreSQL. The API
defines the URLs, HTTP methods, request shape, response shape, and errors that
both sides agree to use.

## 2. What REST means

REST (Representational State Transfer) is a style for designing web APIs
around resources. A REST API:

- names resources with nouns, such as `diary`, `topics`, and `resources`;
- uses HTTP methods to describe the requested operation;
- treats each request as independent (stateless);
- returns representations of resources, normally JSON; and
- uses HTTP status codes to communicate the result.

REST does not require a specific framework or database. Express, Prisma, and
PostgreSQL are implementation choices behind this API.

## 3. What an endpoint is

An endpoint is one callable API location, usually the combination of an HTTP
method and a URL. For example:

```text
GET /api/diary
```

is the endpoint for listing diary posts. The same path with `POST` is a
different endpoint with a different purpose and request contract.

## 4. HTTP methods

| Method | Meaning | Typical use here |
|---|---|---|
| `GET` | Read data without changing it | List or retrieve published content |
| `POST` | Create a new resource or trigger an action | Create editorial content or subscribe an email |
| `PATCH` | Partially update an existing resource | Change selected fields on an editorial record |
| `DELETE` | Remove or deactivate a resource | Delete editorial content or unsubscribe |

`PATCH` bodies contain only fields that should change. A successful `GET` must
not mutate data. Destructive editorial operations should be protected by
authentication and authorization.

## 5. HTTP status codes

The API will use status codes consistently:

| Code | Meaning | Example |
|---:|---|---|
| `200 OK` | Successful read or update | A post was returned or patched |
| `201 Created` | A resource was created | A new topic was added |
| `204 No Content` | Successful operation with no response body | An editorial record was deleted |
| `400 Bad Request` | Malformed request or invalid query/parameter format | Invalid UUID |
| `401 Unauthorized` | No valid authentication credentials | Missing admin token |
| `403 Forbidden` | Authenticated but not allowed to perform the action | Reader attempting to publish |
| `404 Not Found` | Resource does not exist or is not visible | Unknown post ID |
| `409 Conflict` | Request conflicts with a uniqueness or state rule | Duplicate slug or email |
| `422 Unprocessable Entity` | JSON is well formed but fails field validation | Empty post title |
| `500 Internal Server Error` | Unexpected server failure | Unhandled database outage |

Error responses should use one predictable shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "details": [
      { "field": "title", "message": "Title is required." }
    ]
  }
}
```

The backend must not expose SQL, Prisma internals, stack traces, or secrets in
error responses.

## 6. Request versus response

A **request** is what the frontend sends: the method, URL, headers, query
parameters, path parameters, and (for applicable methods) a JSON body.

A **response** is what the backend sends back: a status code, headers, and
usually a JSON body. Unless an endpoint returns `204`, successful responses
will use a consistent top-level key:

```json
{ "data": { "...": "resource fields" } }
```

Collections use a list and pagination metadata:

```json
{
  "data": [],
  "meta": { "page": 1, "limit": 20, "total": 0 }
}
```

The frontend should rely on documented fields rather than database column
names that are not part of the public contract.

## 7. Route versus controller

The **route** maps an HTTP method and path to a handler. It should be small:
register middleware, identify the endpoint, and delegate. It must not contain
Prisma queries.

The **controller** handles the HTTP boundary. It reads parameters and the
validated request body, calls the appropriate service, and chooses the HTTP
status and response shape. It should not contain database-specific queries.

Example boundary:

```text
diary.routes.ts
  router.get("/", diaryController.list)
diary.controller.ts
  list(req, res, next) -> diaryService.listPublished(...)
```

## 8. Controller versus service

The **controller** knows HTTP concepts (`req`, `res`, status codes, and
headers). The **service** knows the application's business rules, such as:

- public users can only see published posts and resources;
- a post slug must be unique;
- a newsletter email is normalized before it is stored; and
- unsubscribing changes subscription state rather than exposing database
  details.

Services should be callable from other interfaces later (for example, an
admin job) without constructing Express request or response objects.

## 9. Service versus Prisma/database layer

The **service** decides what operation the application needs and enforces
business rules. The **Prisma layer** translates that operation into typed
database access, relations, filters, and transactions. Prisma then communicates
with **PostgreSQL**.

The intended dependency direction is:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL
```

For example, `diaryService.listPublished()` may ask a repository or Prisma
client for posts where `status = PUBLISHED`; the route must never call
`prisma.post.findMany()` directly.

## 10. Why responsibilities are separate

Separation gives each layer one reason to change:

- Routes can change URL organization without changing business rules.
- Controllers can change HTTP formatting without changing persistence.
- Services can be unit-tested without starting Express or PostgreSQL.
- Prisma code can change when the schema or database changes.
- Authentication, validation, logging, and error middleware can be applied
  consistently.
- Database implementation details stay private and cannot accidentally leak
  into every route.

It also prevents duplicated rules. For example, the published-content rule
belongs in the service path used by every public content endpoint, not in one
route's inline `where` clause.

## Proposed module layout

The existing health endpoint establishes the route/controller convention. The
future feature modules should follow the same pattern:

```text
src/
  routes/
    diary.routes.ts
    topics.routes.ts
    resources.routes.ts
    prompts.routes.ts
    newsletter.routes.ts
  controllers/
    diary.controller.ts
    topics.controller.ts
    resources.controller.ts
    prompts.controller.ts
    newsletter.controller.ts
  services/
    diary.service.ts
    topics.service.ts
    resources.service.ts
    prompts.service.ts
    newsletter.service.ts
  lib/
    prisma.ts
```

The route modules will eventually be mounted as:

```text
app.use("/api/diary", diaryRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/resources", resourcesRouter);
app.use("/api/prompts", promptsRouter);
app.use("/api/newsletter", newsletterRouter);
```

## API resource design

### Shared conventions

- IDs are UUID path parameters unless stated otherwise.
- `page` is 1-based and defaults to `1`; `limit` defaults to `20` and will
  have a server-defined maximum.
- Public collection endpoints return published/active records by default.
- Draft and unpublished records are never returned to unauthenticated users.
- Admin/editor endpoints require authentication and authorization. The exact
  token/session mechanism is intentionally deferred until authentication is
  designed.
- Response examples omit timestamps and unrelated fields where they do not
  affect the contract.

### Diary (`Post`)

`/api/diary` represents the `Post` model: a diary article or editorial post.

| Endpoint | Method | Purpose | Request body | Parameters | Expected response | Possible errors | Authentication |
|---|---|---|---|---|---|---|---|
| `/api/diary` | `GET` | List published diary posts | None | Query: `page`, `limit`, `topic`, `search` (optional) | `200` with paginated posts, including public fields and topics | `400` invalid query; `500` server failure | None |
| `/api/diary/:id` | `GET` | Retrieve one published post by UUID | None | Path: `id` | `200` with one post | `400` invalid UUID; `404` not found/not published | None |
| `/api/diary/slug/:slug` | `GET` | Retrieve one published post by public slug | None | Path: `slug` | `200` with one post | `404` not found/not published | None |
| `/api/diary` | `POST` | Create a diary post, normally as a draft | `slug`, `title`, `excerpt`, `content`; optional `coverImageUrl`, `coverImageAlt`, `publishedAt`, `status`, `topicIds` | None | `201` with created post | `401`, `403`; `409` duplicate slug; `422` invalid fields | Admin/editor |
| `/api/diary/:id` | `PATCH` | Partially edit a post or its publication state | Any subset of editable fields: `slug`, `title`, `excerpt`, `content`, cover fields, `publishedAt`, `status`, `topicIds` | Path: `id` | `200` with updated post | `400`; `401`, `403`; `404`; `409`; `422` | Admin/editor |
| `/api/diary/:id` | `DELETE` | Delete a post | None | Path: `id` | `204` with no body | `400`; `401`, `403`; `404` | Admin/editor |

Public diary responses should include `id`, `slug`, `title`, `excerpt`,
`content`, cover image fields, `publishedAt`, and topic summaries. Internal
editorial fields may be restricted or returned only to authenticated editors.

### Topics (`Topic`)

`/api/topics` represents editorial topics used to filter and classify posts.

| Endpoint | Method | Purpose | Request body | Parameters | Expected response | Possible errors | Authentication |
|---|---|---|---|---|---|---|---|
| `/api/topics` | `GET` | List topics for navigation and filtering | None | Query: `page`, `limit` | `200` with ordered topics | `400` invalid pagination; `500` server failure | None |
| `/api/topics/:id` | `GET` | Retrieve one topic and its public post summary | None | Path: `id` | `200` with topic and optional post summaries | `400` invalid UUID; `404` not found | None |
| `/api/topics` | `POST` | Create a topic | `slug`, `name`, `description`, `sortOrder` | None | `201` with created topic | `401`, `403`; `409` duplicate slug; `422` invalid fields | Admin/editor |
| `/api/topics/:id` | `PATCH` | Update topic metadata or ordering | Any subset of `slug`, `name`, `description`, `sortOrder` | Path: `id` | `200` with updated topic | `400`; `401`, `403`; `404`; `409`; `422` | Admin/editor |
| `/api/topics/:id` | `DELETE` | Delete a topic and its post associations | None | Path: `id` | `204` with no body | `400`; `401`, `403`; `404`; `409` if deletion is disallowed by policy | Admin/editor |

`sortOrder` controls display order. Deleting a topic must follow the
relationship policy agreed during implementation because its join rows are
cascaded by the current Prisma schema.

### Resources (`Resource`)

`/api/resources` represents recommended resources. The category can be used as
a filter; `ResourceCategory` does not receive a separate API in this phase.

| Endpoint | Method | Purpose | Request body | Parameters | Expected response | Possible errors | Authentication |
|---|---|---|---|---|---|---|---|
| `/api/resources` | `GET` | List published resources | None | Query: `categoryId` or `category` (optional), `page`, `limit` | `200` with paginated resources and category summary | `400` invalid filter/pagination; `500` server failure | None |
| `/api/resources/:id` | `GET` | Retrieve one published resource | None | Path: `id` | `200` with one resource | `400` invalid UUID; `404` not found/not published | None |
| `/api/resources` | `POST` | Create a resource | `categoryId`, `title`, `description`, `sortOrder`; optional `url`, `author`, `isPublished` | None | `201` with created resource | `401`, `403`; `404` category missing; `422` invalid fields | Admin/editor |
| `/api/resources/:id` | `PATCH` | Update resource metadata or publication state | Any subset of category, title, description, URL, author, order, publication fields | Path: `id` | `200` with updated resource | `400`; `401`, `403`; `404`; `422` | Admin/editor |
| `/api/resources/:id` | `DELETE` | Delete a resource | None | Path: `id` | `204` with no body | `400`; `401`, `403`; `404` | Admin/editor |

If category management becomes necessary, it should be added as a separately
designed `/api/resource-categories` resource rather than hiding category CRUD
inside resource routes.

### Prompts (`JournalPrompt`)

`/api/prompts` represents reusable journal prompts, not users' private journal
responses.

| Endpoint | Method | Purpose | Request body | Parameters | Expected response | Possible errors | Authentication |
|---|---|---|---|---|---|---|---|
| `/api/prompts` | `GET` | List published prompts | None | Query: `page`, `limit` | `200` with ordered prompts | `400` invalid pagination; `500` server failure | None |
| `/api/prompts/:id` | `GET` | Retrieve one published prompt | None | Path: `id` | `200` with one prompt | `400` invalid UUID; `404` not found/not published | None |
| `/api/prompts` | `POST` | Create a prompt | `prompt`, `sortOrder`; optional `isPublished` | None | `201` with created prompt | `401`, `403`; `422` invalid fields | Admin/editor |
| `/api/prompts/:id` | `PATCH` | Edit or publish a prompt | Any subset of `prompt`, `sortOrder`, `isPublished` | Path: `id` | `200` with updated prompt | `400`; `401`, `403`; `404`; `422` | Admin/editor |
| `/api/prompts/:id` | `DELETE` | Delete a prompt | None | Path: `id` | `204` with no body | `400`; `401`, `403`; `404` | Admin/editor |

The API must not accept or return private journal responses because those are
outside the current `JournalPrompt` model and require a user/account design.

### Newsletter (`NewsletterSubscriber`)

`/api/newsletter` represents subscription actions rather than publicly
queryable subscriber records. Subscriber enumeration and email addresses must
never be exposed through public `GET` endpoints.

| Endpoint | Method | Purpose | Request body | Parameters | Expected response | Possible errors | Authentication |
|---|---|---|---|---|---|---|---|
| `/api/newsletter/subscribe` | `POST` | Subscribe an email address | `{ "email": "person@example.com" }` | None | `201` for a new subscription; `200` if already subscribed, without revealing extra account data | `400` invalid email; `500` provider/database failure | None, with rate limiting and abuse protection |
| `/api/newsletter/:id` | `DELETE` | Unsubscribe a subscriber using a future opaque token/authorized link | None | Path: `id` is not sufficient by itself; implementation must require an unsubscribe token or equivalent proof | `204` with no body | `400` invalid token; `404` invalid/expired token; `429` rate limit | Token/link authentication |
| `/api/newsletter/subscribers/:id` | `GET` | View one subscriber for support/admin use | None | Path: `id` | `200` with minimized subscriber status, never unnecessary secrets | `401`, `403`; `404` | Admin/support |

The current schema supports soft unsubscribe through `unsubscribedAt`.
Re-subscribing an existing address should clear that timestamp rather than
creating a duplicate row. Email normalization and confirmation-email/provider
integration are implementation decisions for the newsletter phase.

## Authentication and authorization boundary

Authentication is not implemented yet. The contract distinguishes:

- **Public**: published editorial reads and newsletter subscription.
- **Admin/editor**: create, update, publish, and delete editorial content.
- **Token/link protected**: a subscriber's own unsubscribe action.

Authentication middleware should run before controllers for protected routes.
Authorization should then verify the caller's role or permission. A
controller must not infer authorization from a request body field such as
`isAdmin`.

## Request lifecycle example

For `PATCH /api/diary/:id`:

1. The route matches the method and path and applies authentication middleware.
2. Validation middleware checks the UUID and allowed JSON fields.
3. The controller reads the validated input and calls
   `diaryService.update(id, input, actor)`.
4. The service checks business rules, such as slug uniqueness and publication
   permissions.
5. Prisma performs the typed update and topic relation update.
6. PostgreSQL persists the transaction.
7. The service returns a domain result.
8. The controller sends `200` with `{ "data": ... }`, or passes a typed error
   to the shared error middleware.

At no point should the route definition contain a PostgreSQL or Prisma query.

## Deliberately deferred implementation decisions

The following should be decided before implementation of protected CRUD:

1. Authentication mechanism and editor roles.
2. Validation library and exact field limits.
3. Pagination maximum and sorting contract.
4. Whether public diary retrieval should use `:id`, `:slug`, or both.
5. Newsletter confirmation and unsubscribe-token provider.
6. Whether delete means hard delete or an editorial archive operation.
