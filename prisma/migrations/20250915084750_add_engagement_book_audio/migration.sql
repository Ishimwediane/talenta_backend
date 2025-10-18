-- AlterTable
ALTER TABLE "Audio" ADD COLUMN     "commentsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sharesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "audio_likes" (
    "id" TEXT NOT NULL,
    "audioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_ratings" (
    "id" TEXT NOT NULL,
    "audioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_comments" (
    "id" TEXT NOT NULL,
    "audioId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_views" (
    "id" TEXT NOT NULL,
    "audioId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_shares" (
    "id" TEXT NOT NULL,
    "audioId" TEXT NOT NULL,
    "userId" TEXT,
    "channel" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audio_likes_audioId_userId_key" ON "audio_likes"("audioId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "audio_ratings_audioId_userId_key" ON "audio_ratings"("audioId", "userId");

-- CreateIndex
CREATE INDEX "audio_views_audioId_userId_idx" ON "audio_views"("audioId", "userId");

-- CreateIndex
CREATE INDEX "audio_shares_audioId_idx" ON "audio_shares"("audioId");

-- AddForeignKey
ALTER TABLE "audio_likes" ADD CONSTRAINT "audio_likes_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_likes" ADD CONSTRAINT "audio_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_ratings" ADD CONSTRAINT "audio_ratings_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_ratings" ADD CONSTRAINT "audio_ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_comments" ADD CONSTRAINT "audio_comments_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_comments" ADD CONSTRAINT "audio_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_views" ADD CONSTRAINT "audio_views_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_views" ADD CONSTRAINT "audio_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_shares" ADD CONSTRAINT "audio_shares_audioId_fkey" FOREIGN KEY ("audioId") REFERENCES "Audio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_shares" ADD CONSTRAINT "audio_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
