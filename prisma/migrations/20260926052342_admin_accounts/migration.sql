-- AlterTable
ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LoginChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LoginChallenge" ("attempts", "codeHash", "createdAt", "expiresAt", "id", "tokenHash", "userId") SELECT "attempts", "codeHash", "createdAt", "expiresAt", "id", "tokenHash", "userId" FROM "LoginChallenge";
DROP TABLE "LoginChallenge";
ALTER TABLE "new_LoginChallenge" RENAME TO "LoginChallenge";
CREATE UNIQUE INDEX "LoginChallenge_tokenHash_key" ON "LoginChallenge"("tokenHash");
CREATE INDEX "LoginChallenge_userId_idx" ON "LoginChallenge"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
