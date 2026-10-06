# Phase 11 newsletter subscription

Newsletter subscribers belong in PostgreSQL because the application needs
durable subscription state across deployments, duplicate prevention, future
unsubscribe handling, and a controlled source of recipients for a later email
provider integration. Bulk email sending is intentionally not implemented.

## Endpoint

```http
POST /api/newsletter/subscribe
Content-Type: application/json

{
  "email": " Person@Example.com "
}
```

The email is validated with Zod, trimmed, and normalized to lowercase before
it is stored. The database unique constraint on `NewsletterSubscriber.email`
prevents duplicate rows. A previously unsubscribed address is reactivated
instead of creating another row.

New subscription response:

```json
{
  "data": {
    "message": "You are subscribed to the newsletter."
  }
}
```

The new subscription returns `201 Created`; an existing or reactivated
subscription returns `200 OK`. The API does not return subscriber IDs or email
addresses unnecessarily.

Invalid input returns `400` through the shared Zod validation middleware:

```json
{
  "status": "error",
  "message": "Request validation failed.",
  "details": [
    {
      "field": "email",
      "message": "must be a valid email address"
    }
  ]
}
```

The frontend sends the form email as JSON with `fetch`:

```js
await fetch("/api/newsletter/subscribe", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
```

The existing `POST /api/newsletter` route remains as a compatibility alias;
new frontend code should use `/api/newsletter/subscribe`.
