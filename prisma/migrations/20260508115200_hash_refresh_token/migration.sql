-- DropIndex
DROP INDEX "sessions_refreshToken_key";

-- AlterTable
ALTER TABLE "sessions" RENAME COLUMN "refreshToken" TO "refreshTokenHash";

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshTokenHash_key" ON "sessions"("refreshTokenHash");

