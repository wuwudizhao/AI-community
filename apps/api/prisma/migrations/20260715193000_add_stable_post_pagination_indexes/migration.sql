DROP INDEX IF EXISTS "posts_status_created_at_idx";
DROP INDEX IF EXISTS "posts_category_status_created_at_idx";

CREATE INDEX "posts_status_created_at_id_idx"
ON "posts"("status", "created_at" DESC, "id" DESC);

CREATE INDEX "posts_category_status_created_at_id_idx"
ON "posts"("category", "status", "created_at" DESC, "id" DESC);
