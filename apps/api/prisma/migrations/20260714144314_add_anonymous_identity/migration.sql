-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "anonymous_author_id" TEXT,
ALTER COLUMN "author_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "anonymous_identities" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL DEFAULT 'Liftoff 访客',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_identities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_identities_token_hash_key" ON "anonymous_identities"("token_hash");

-- CreateIndex
CREATE INDEX "posts_anonymous_author_id_created_at_idx" ON "posts"("anonymous_author_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_anonymous_author_id_fkey" FOREIGN KEY ("anonymous_author_id") REFERENCES "anonymous_identities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
