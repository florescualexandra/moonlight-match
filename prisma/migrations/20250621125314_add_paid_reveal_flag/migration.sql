/*
  Warnings:

  - You are about to drop the column `isRevealed` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Match" DROP COLUMN "isRevealed",
ADD COLUMN     "isInitiallyRevealed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPaidReveal" BOOLEAN NOT NULL DEFAULT false;
