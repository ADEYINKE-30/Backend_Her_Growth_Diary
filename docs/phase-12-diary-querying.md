# Phase 12 Diary querying

The Diary collection endpoint uses simple offset pagination because the
current content volume is expected to be modest and page-number navigation is
easy for the admin UI and public website to consume. Cursor pagination is not
needed yet; it is more useful for very large or continuously changing feeds.

## Query parameters

`GET /api/diary` supports:

| Parameter | Default | Description |
| --- | --- | --- |
| `page` | `1` | One-based page number |
| `limit` | `20` | Results per page, from `1` to `100` |
| `topic` | none | Exact topic slug, such as `self-growth` |
| `search` | none | Case-insensitive match in title, excerpt, or content |
| `sort` | `createdAt` | `createdAt`, `updatedAt`, `publishedAt`, or `title` |
| `direction` | `desc` | `asc` or `desc` |
| `status` | `PUBLISHED` | `PUBLISHED`, `DRAFT`, or `ALL` |

Public requests always return published posts. `status=DRAFT` and
`status=ALL` require an authenticated administrator. This keeps unpublished
content private while allowing the admin interface to review and manage all
posts.

Examples:

```http
GET /api/diary?page=1&limit=10
GET /api/diary?topic=self-growth
GET /api/diary?search=confidence
GET /api/diary?sort=publishedAt&direction=asc
GET /api/diary?status=ALL&page=2&limit=10
```

The response includes the page data and metadata:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Why pagination and indexes matter

Pagination prevents the API from loading and serializing every article for
each request, which reduces database work, response size, and frontend
rendering cost. Offset pagination is straightforward here, though very large
offsets can become slower; cursor pagination can be introduced later if the
catalog or feed volume requires it.

The `Post` table has indexes for status and common status-plus-date queries.
The topic join table is indexed by `topicId`, and topic slugs are unique, so
topic filtering can use the relationship efficiently. Search currently uses
case-insensitive substring matching, which is appropriate for this small
catalog; full-text search can be considered if the content volume grows.
