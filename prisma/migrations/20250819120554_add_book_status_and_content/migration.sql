-- CreateEnum
CREATE TYPE "public"."BookStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "public"."Book" ADD COLUMN     "content" TEXT,
ADD COLUMN     "status" "public"."BookStatus" NOT NULL DEFAULT 'DRAFT';
