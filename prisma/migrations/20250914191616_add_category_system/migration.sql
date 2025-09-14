/*
  Warnings:

  - You are about to drop the column `category` on the `Audio` table. All the data in the column will be lost.
  - You are about to drop the column `subCategories` on the `Audio` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Book` table. All the data in the column will be lost.
  - You are about to drop the column `subCategories` on the `Book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Audio" DROP COLUMN "category",
DROP COLUMN "subCategories",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "subCategoryId" TEXT;

-- AlterTable
ALTER TABLE "public"."Book" DROP COLUMN "category",
DROP COLUMN "subCategories",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "subCategoryId" TEXT;

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "image" VARCHAR(500),
    "color" VARCHAR(50),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sub_categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_categoryId_name_key" ON "public"."sub_categories"("categoryId", "name");

-- AddForeignKey
ALTER TABLE "public"."Book" ADD CONSTRAINT "Book_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Book" ADD CONSTRAINT "Book_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "public"."sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Audio" ADD CONSTRAINT "Audio_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Audio" ADD CONSTRAINT "Audio_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "public"."sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
