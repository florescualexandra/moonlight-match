/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `maxAttendees` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `ticketPrice` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Event` table. All the data in the column will be lost.
  - Added the required column `eventId` to the `Match` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `Match` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "createdAt",
DROP COLUMN "location",
DROP COLUMN "maxAttendees",
DROP COLUMN "ticketPrice",
DROP COLUMN "updatedAt",
ADD COLUMN     "matchesSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "eventId" TEXT NOT NULL,
ADD COLUMN     "score" DOUBLE PRECISION NOT NULL;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
