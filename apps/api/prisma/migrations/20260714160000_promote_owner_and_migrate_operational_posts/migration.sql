-- Promote the existing owner account through an explicit server-side migration.
UPDATE "users"
SET "role" = 'ADMIN'
WHERE "username" = 'liftoff_owner';

-- Preserve every post field and relation while changing only ownership.
UPDATE "posts"
SET "author_id" = (SELECT "id" FROM "users" WHERE "username" = 'liftoff_owner'),
    "anonymous_author_id" = NULL
WHERE "slug" IN (
  'ai-86ae6c9d-a34732218f',
  'agent-reach-d356ebf7-b9e10ec8d3',
  'post-0e68a07a-eb1b16e112',
  '19-9-pdf-1014a9a2-7cfc956141'
);

-- Keep the legacy system account disabled for audit history.
UPDATE "users"
SET "status" = 'BANNED'
WHERE "email_normalized" = 'guest@liftoff.local';
