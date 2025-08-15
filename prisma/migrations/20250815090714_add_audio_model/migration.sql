-- AlterTable
ALTER TABLE "public"."Audio" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Audio" ADD CONSTRAINT "Audio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
