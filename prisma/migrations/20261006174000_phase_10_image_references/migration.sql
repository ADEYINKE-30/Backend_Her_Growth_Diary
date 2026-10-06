ALTER TABLE "Post"
  ADD COLUMN "coverImagePublicId" TEXT;

ALTER TABLE "Resource"
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "imagePublicId" TEXT;
