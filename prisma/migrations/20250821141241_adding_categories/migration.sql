-- AlterTable
ALTER TABLE "public"."Audio" ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "subCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "public"."Book" ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "subCategories" TEXT[] DEFAULT ARRAY[]::TEXT[];
