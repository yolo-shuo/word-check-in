-- CreateEnum
CREATE TYPE "Mastery" AS ENUM ('NEW', 'LEARNING', 'KNOWN', 'MASTERED', 'REVIEWING');

-- CreateTable
CREATE TABLE "WordProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "mastery" "Mastery" NOT NULL DEFAULT 'NEW',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WordProgress_userId_nextReviewAt_idx" ON "WordProgress"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "WordProgress_userId_mastery_idx" ON "WordProgress"("userId", "mastery");

-- CreateIndex
CREATE UNIQUE INDEX "WordProgress_userId_entryId_key" ON "WordProgress"("userId", "entryId");

-- AddForeignKey
ALTER TABLE "WordProgress" ADD CONSTRAINT "WordProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordProgress" ADD CONSTRAINT "WordProgress_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "VocabEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
