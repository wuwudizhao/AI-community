CREATE TYPE "PostCategory" AS ENUM (
  'MONEY_OPPORTUNITY',
  'SIDE_PROJECT',
  'INCOME_CASE',
  'PROJECT_BREAKDOWN',
  'TUTORIAL_PRACTICE',
  'FAILURE_REVIEW',
  'SOLO_COMPANY',
  'VIBE_CODING',
  'AGENT',
  'RAG',
  'MCP',
  'FDE',
  'OPC_METHODOLOGY',
  'TOOLS_RESOURCES'
);

ALTER TABLE "posts" ADD COLUMN "category" "PostCategory";

UPDATE "posts" SET "category" = 'MONEY_OPPORTUNITY'
WHERE "slug" IN (
  '19-9-pdf-1014a9a2-7cfc956141',
  'smoke-ai-f85d2ed2-ca66cacb8f'
);

UPDATE "posts" SET "category" = 'SIDE_PROJECT'
WHERE "slug" IN (
  'post-0e68a07a-eb1b16e112',
  'ai-86ae6c9d-a34732218f'
);

UPDATE "posts" SET "category" = 'TOOLS_RESOURCES'
WHERE "slug" = 'agent-reach-d356ebf7-b9e10ec8d3';

DO $$
DECLARE
  unmapped_posts TEXT;
BEGIN
  SELECT string_agg("slug", ', ' ORDER BY "created_at")
  INTO unmapped_posts
  FROM "posts"
  WHERE "category" IS NULL;

  IF unmapped_posts IS NOT NULL THEN
    RAISE EXCEPTION 'Post category migration requires an explicit mapping for: %', unmapped_posts;
  END IF;
END $$;

ALTER TABLE "posts" ALTER COLUMN "category" SET NOT NULL;

CREATE INDEX "posts_category_status_created_at_idx"
ON "posts"("category", "status", "created_at" DESC);
