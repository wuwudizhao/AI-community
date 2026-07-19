ALTER TABLE "posts"
ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "posts_status_created_at_id_idx";

CREATE INDEX "posts_status_pinned_created_at_id_idx"
ON "posts"("status", "pinned" DESC, "created_at" DESC, "id" DESC);
