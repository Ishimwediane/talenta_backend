/*
  Warnings:

  - You are about to drop the column `allowChapterContributions` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `isCollaborative` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the `book_contributors` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."book_contributors" DROP CONSTRAINT "book_contributors_bookId_fkey";

-- DropForeignKey
ALTER TABLE "public"."book_contributors" DROP CONSTRAINT "book_contributors_userId_fkey";

-- AlterTable
ALTER TABLE "public"."Book" DROP COLUMN "allowChapterContributions",
DROP COLUMN "isCollaborative";

-- DropTable
DROP TABLE "public"."book_contributors";

-- DropEnum
DROP TYPE "public"."ContributorRole";

-- DropEnum
DROP TYPE "public"."ContributorStatus";
