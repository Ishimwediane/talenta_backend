-- AlterTable
ALTER TABLE "public"."Audio" ADD COLUMN     "segmentPublicIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "segmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "totalDuration" INTEGER;
