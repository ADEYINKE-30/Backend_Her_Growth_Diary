# Phase 6 content CRUD

Phase 6 adds CRUD APIs for topics, resources, and journal prompts using the
same route, controller, service, Prisma, and PostgreSQL boundaries as Diary.

## Endpoints

Each resource supports `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, and
`DELETE /:id`:

- `/api/topics`
- `/api/resources`
- `/api/prompts`

Collection responses use `data` and pagination `meta`. Mutations return
`201` for creation, `200` for updates, and `204` for deletion. Invalid UUIDs
return `400`; invalid fields return `422`; missing records return `404`;
duplicate topic slugs return `409`.

Resources and prompts follow the Phase 4 public-content rule: collection and
single-item GET endpoints return published records only. Topics are publicly
listed regardless of status because the model has no publication flag.
Authentication and authorization remain deferred, consistent with the current
development phase.
