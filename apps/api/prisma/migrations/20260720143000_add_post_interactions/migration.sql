CREATE TABLE "post_likes" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "post_bookmarks" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "post_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "post_view_histories" (
  "id" TEXT NOT NULL,
  "post_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "first_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "view_count" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "post_view_histories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "post_likes_user_id_post_id_key" ON "post_likes"("user_id", "post_id");
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");
CREATE INDEX "post_likes_user_id_created_at_idx" ON "post_likes"("user_id", "created_at" DESC);
CREATE UNIQUE INDEX "post_bookmarks_user_id_post_id_key" ON "post_bookmarks"("user_id", "post_id");
CREATE INDEX "post_bookmarks_user_id_created_at_idx" ON "post_bookmarks"("user_id", "created_at" DESC);
CREATE INDEX "post_bookmarks_post_id_idx" ON "post_bookmarks"("post_id");
CREATE UNIQUE INDEX "post_view_histories_user_id_post_id_key" ON "post_view_histories"("user_id", "post_id");
CREATE INDEX "post_view_histories_user_id_last_viewed_at_idx" ON "post_view_histories"("user_id", "last_viewed_at" DESC);
CREATE INDEX "post_view_histories_post_id_idx" ON "post_view_histories"("post_id");

ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_view_histories" ADD CONSTRAINT "post_view_histories_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "post_view_histories" ADD CONSTRAINT "post_view_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
