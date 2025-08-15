/*
  Warnings:

  - Added the required column `fileName` to the `Audio` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Audio" ADD COLUMN     "description" TEXT,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT;
