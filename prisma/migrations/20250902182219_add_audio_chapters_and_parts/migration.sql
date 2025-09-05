/*
  Warnings:

  - Added the required column `updatedAt` to the `Audio` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."AudioChapterStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."AudioPartStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."Audio" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "public"."audio_chapters" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "public"."AudioChapterStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "duration" INTEGER,
    "wordCount" INTEGER,
    "audioId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audio_parts" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "status" "public"."AudioPartStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "fileName" TEXT NOT NULL,
    "publicId" TEXT,
    "fileUrl" TEXT NOT NULL,
    "duration" INTEGER,
    "chapterId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audio_chapters_audioId_order_key" ON "public"."audio_chapters"("audioId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "audio_parts_chapterId_order_key" ON "public"."audio_parts"("chapterId", "order");

-- AddForeignKey
ALTER TABLE "public"."audio_chapters" ADD CONSTRAINT "audio_chapters_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "public"."Audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audio_chapters" ADD CONSTRAINT "audio_chapters_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audio_parts" ADD CONSTRAINT "audio_parts_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "public"."audio_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audio_parts" ADD CONSTRAINT "audio_parts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
