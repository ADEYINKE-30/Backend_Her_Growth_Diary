# Phase 8 administrator authentication

Phase 8 adds authentication for the administrator without creating public user
accounts or changing public website access.

## Endpoints

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/me`

Public content GET endpoints remain public. Editorial mutations for Diary,
Topics, Resources, and Journal Prompts require an authenticated `ADMIN`
session. `EDITOR` sessions are authenticated but receive `403` for these
administrator-only operations.

## Architecture

The implementation uses:

- Argon2id password hashes; plaintext passwords are never stored or returned.
- PostgreSQL-backed server sessions rather than JWTs.
- Random session tokens stored only as SHA-256 hashes in PostgreSQL.
- `HttpOnly`, `SameSite=Lax` cookies for the session.
- A separate readable CSRF cookie and required `X-CSRF-Token` header for
  cookie-authenticated state-changing requests.
- Eight-hour session expiration and explicit logout revocation.
- Generic invalid-login errors to reduce account enumeration.

The request flow is:

```text
Request
  ↓
Session authentication middleware
  ↓
Role and CSRF middleware for mutations
  ↓
Zod body validation
  ↓
Controller
  ↓
Service
  ↓
Prisma
  ↓
PostgreSQL
```

## Initial administrator setup

There is no public registration endpoint. Create the first administrator
through the one-time setup command with environment variables:

```powershell
$env:ADMIN_EMAIL = "admin@example.com"
$env:ADMIN_PASSWORD = "use-a-long-unique-password"
npm.cmd run admin:setup
Remove-Item Env:ADMIN_EMAIL
Remove-Item Env:ADMIN_PASSWORD
```

The setup command requires a password of at least 12 characters and fails if
the email already exists.

## Login and CSRF usage

```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "use-a-long-unique-password"
}
```

The response contains only the administrator's `id`, `email`, and `role`.
The server sets the session and CSRF cookies. For mutations, the client must
copy the CSRF cookie value into the `X-CSRF-Token` request header.

```http
POST /api/diary
Cookie: hgd_admin_session=...; hgd_admin_csrf=...
X-CSRF-Token: ...
Content-Type: application/json
```

Logout revokes the current session and clears both cookies:

```http
POST /api/admin/logout
Cookie: hgd_admin_session=...; hgd_admin_csrf=...
X-CSRF-Token: ...
```

Authentication and authorization remain administrator/editor-only. Public
website visitors do not need accounts.
