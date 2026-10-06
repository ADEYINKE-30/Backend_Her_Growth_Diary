# Phase 10 image storage

Images are stored in Cloudinary rather than on the application server.
Application-server disks are often ephemeral, do not scale safely across
instances, and should not be used as a permanent media store.

Cloudinary stores, transforms, optimizes, and CDN-serves images. PostgreSQL
stores the Cloudinary HTTPS delivery URL and `public_id` needed for later
replacement or deletion.

## Configuration

Set these server-only environment variables:

```text
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

The API secret is never returned or logged.

## Upload flow

```text
Authenticated ADMIN request
  ↓
CSRF check
  ↓
Multer memory limit (5 MB, one file)
  ↓
MIME and file-signature validation
  ↓
Cloudinary upload
  ↓
PostgreSQL URL/public_id update
  ↓
Old Cloudinary asset deletion on replacement
```

Upload or replace an image:

```http
POST /api/uploads/images
Content-Type: multipart/form-data
Cookie: hgd_admin_session=...
X-CSRF-Token: ...

file: <JPEG, PNG, or WebP, max 5 MB>
target: diary
targetId: <post UUID>
```

Use `target=resource` for a Resource. The response includes the secure URL,
public ID, dimensions, and format. Existing assets are replaced using their
stored public ID. `DELETE /api/uploads/images/:target/:id` clears the database
reference and deletes the Cloudinary asset.

Supported formats are JPEG, PNG, and WebP. Client filenames are not trusted,
SVG and arbitrary files are rejected, and upload routes require an ADMIN
session plus CSRF protection.
