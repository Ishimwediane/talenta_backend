-- CreateEnum
CREATE TYPE "public"."AudioStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- AlterTable
ALTER TABLE "public"."Audio" ADD COLUMN     "status" "public"."AudioStatus" NOT NULL DEFAULT 'DRAFT';
