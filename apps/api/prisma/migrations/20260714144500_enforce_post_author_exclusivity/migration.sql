-- A post belongs to exactly one registered or anonymous author.
ALTER TABLE "posts" ADD CONSTRAINT "posts_exactly_one_author_check"
CHECK (num_nonnulls("author_id", "anonymous_author_id") = 1);
