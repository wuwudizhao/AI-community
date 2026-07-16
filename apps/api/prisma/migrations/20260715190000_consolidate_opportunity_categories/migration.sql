-- Preserve the former category meaning as ordinary tags before changing categories.
INSERT INTO "tags" ("id", "name", "slug")
SELECT 'system-tag-side-project', '副业项目', 'tag-5a658721'
WHERE NOT EXISTS (
  SELECT 1 FROM "tags" WHERE "name" = '副业项目' OR "slug" = 'tag-5a658721'
);

INSERT INTO "tags" ("id", "name", "slug")
SELECT 'system-tag-income-case', '收入案例', 'tag-58834431'
WHERE NOT EXISTS (
  SELECT 1 FROM "tags" WHERE "name" = '收入案例' OR "slug" = 'tag-58834431'
);

INSERT INTO "post_tags" ("post_id", "tag_id")
SELECT p."id", t."id"
FROM "posts" p
JOIN "tags" t ON t."name" = '副业项目'
WHERE p."category" = 'SIDE_PROJECT'
ON CONFLICT ("post_id", "tag_id") DO NOTHING;

INSERT INTO "post_tags" ("post_id", "tag_id")
SELECT p."id", t."id"
FROM "posts" p
JOIN "tags" t ON t."name" = '收入案例'
WHERE p."category" = 'INCOME_CASE'
ON CONFLICT ("post_id", "tag_id") DO NOTHING;

UPDATE "posts"
SET "category" = 'MONEY_OPPORTUNITY'
WHERE "category" IN ('SIDE_PROJECT', 'INCOME_CASE');

-- PostgreSQL enum values cannot be removed in place. Rebuild the enum after all rows migrate.
CREATE TYPE "PostCategory_next" AS ENUM (
  'MONEY_OPPORTUNITY',
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

ALTER TABLE "posts"
  ALTER COLUMN "category" TYPE "PostCategory_next"
  USING ("category"::text::"PostCategory_next");

DROP TYPE "PostCategory";
ALTER TYPE "PostCategory_next" RENAME TO "PostCategory";
