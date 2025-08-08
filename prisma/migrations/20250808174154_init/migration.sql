-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'CREATOR', 'ADMIN', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."ContentType" AS ENUM ('FILM', 'PODCAST', 'POETRY', 'MUSIC', 'PHOTOGRAPHY', 'ART');

-- CreateEnum
CREATE TYPE "public"."Interest" AS ENUM ('FILM', 'POETRY', 'PODCAST', 'MUSIC', 'PHOTOGRAPHY', 'ART', 'TECHNOLOGY', 'EDUCATION', 'SOCIAL_COMMENTARY', 'ENTERTAINMENT');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "googleId" VARCHAR(255),
    "password" VARCHAR(255) NOT NULL,
    "profilePicture" VARCHAR(500),
    "bio" VARCHAR(500),
    "location" VARCHAR(100),
    "dateOfBirth" TIMESTAMP(3),
    "gender" "public"."Gender" NOT NULL DEFAULT 'PREFER_NOT_TO_SAY',
    "interests" "public"."Interest"[],
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" VARCHAR(255),
    "verificationTokenExpires" TIMESTAMP(3),
    "resetPasswordToken" VARCHAR(255),
    "resetPasswordExpires" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instagram" VARCHAR(255),
    "twitter" VARCHAR(255),
    "facebook" VARCHAR(255),
    "youtube" VARCHAR(255),
    "tiktok" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."earnings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "withdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_stats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalShares" INTEGER NOT NULL DEFAULT 0,
    "totalContent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contents" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "public"."ContentType" NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fileUrl" VARCHAR(500) NOT NULL,
    "thumbnailUrl" VARCHAR(500),
    "duration" INTEGER,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_interests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interest" "public"."Interest" NOT NULL,

    CONSTRAINT "user_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."books" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "authors" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "publisher" VARCHAR(255),
    "publicationDate" TIMESTAMP(3),
    "isbn" VARCHAR(20),
    "category" VARCHAR(100),
    "language" VARCHAR(50),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pageCount" INTEGER,
    "rights" VARCHAR(255),
    "coverImageUrl" VARCHAR(500),
    "bookFileUrl" VARCHAR(500) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "public"."users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_verificationToken_key" ON "public"."users"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "public"."users"("resetPasswordToken");

-- CreateIndex
CREATE UNIQUE INDEX "social_links_userId_key" ON "public"."social_links"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "earnings_userId_key" ON "public"."earnings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_stats_userId_key" ON "public"."user_stats"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_interests_userId_interest_key" ON "public"."user_interests"("userId", "interest");

-- CreateIndex
CREATE UNIQUE INDEX "books_isbn_key" ON "public"."books"("isbn");

-- AddForeignKey
ALTER TABLE "public"."social_links" ADD CONSTRAINT "social_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."earnings" ADD CONSTRAINT "earnings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_stats" ADD CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contents" ADD CONSTRAINT "contents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."books" ADD CONSTRAINT "books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
