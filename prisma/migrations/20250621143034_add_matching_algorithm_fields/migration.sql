/*
  Warnings:

  - A unique constraint covering the columns `[userId,matchedUserId,eventId]` on the table `Match` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Match_userId_matchedUserId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Match_userId_matchedUserId_eventId_key" ON "Match"("userId", "matchedUserId", "eventId");
