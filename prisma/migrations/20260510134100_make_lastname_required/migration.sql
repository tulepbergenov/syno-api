-- Backfill existing null last names before adding NOT NULL.
UPDATE "users"
SET "lastName" = ''
WHERE "lastName" IS NULL;

-- AlterTable
ALTER TABLE "users"
ALTER COLUMN "lastName" SET NOT NULL;

