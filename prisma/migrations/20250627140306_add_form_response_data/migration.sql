/*
  Warnings:

  - Added the required column `data` to the `formResponse` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "formResponse" ADD COLUMN     "data" JSONB NOT NULL;
