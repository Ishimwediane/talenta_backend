-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "characters" TEXT,
ADD COLUMN     "estimatedReadingTime" INTEGER,
ADD COLUMN     "language" VARCHAR(50),
ADD COLUMN     "targetAudience" VARCHAR(100);

-- CreateTable
CREATE TABLE "table_of_contents" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "pageNumber" INTEGER,
    "chapterId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "bookId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "table_of_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "table_of_contents_bookId_order_key" ON "table_of_contents"("bookId", "order");

-- AddForeignKey
ALTER TABLE "table_of_contents" ADD CONSTRAINT "table_of_contents_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_of_contents" ADD CONSTRAINT "table_of_contents_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
