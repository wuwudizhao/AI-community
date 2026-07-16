CREATE TABLE "post_images" (
  "id" TEXT NOT NULL,
  "storage_key" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "size_bytes" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "uploader_user_id" TEXT,
  "anonymous_identity_id" TEXT,
  "post_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "post_images_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "post_images_one_uploader_check" CHECK (
    ("uploader_user_id" IS NOT NULL AND "anonymous_identity_id" IS NULL)
    OR
    ("uploader_user_id" IS NULL AND "anonymous_identity_id" IS NOT NULL)
  )
);

CREATE UNIQUE INDEX "post_images_storage_key_key" ON "post_images"("storage_key");
CREATE INDEX "post_images_uploader_user_id_created_at_idx" ON "post_images"("uploader_user_id", "created_at");
CREATE INDEX "post_images_anonymous_identity_id_created_at_idx" ON "post_images"("anonymous_identity_id", "created_at");
CREATE INDEX "post_images_post_id_idx" ON "post_images"("post_id");

ALTER TABLE "post_images"
  ADD CONSTRAINT "post_images_uploader_user_id_fkey"
  FOREIGN KEY ("uploader_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_images"
  ADD CONSTRAINT "post_images_anonymous_identity_id_fkey"
  FOREIGN KEY ("anonymous_identity_id") REFERENCES "anonymous_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_images"
  ADD CONSTRAINT "post_images_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
