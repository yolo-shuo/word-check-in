-- CreateEnum
CREATE TYPE "CircleType" AS ENUM ('PUBLIC', 'PRIVATE', 'INVITE_ONLY');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "Circle" ADD COLUMN     "allowLeaderboard" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowMemberInvite" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "circleType" "CircleType" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "examType" TEXT,
ADD COLUMN     "maxMembers" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "studyDirection" TEXT;

-- AlterTable
ALTER TABLE "CircleMember" ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "mutedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VocabEntry" ADD COLUMN     "antonyms" JSONB,
ADD COLUMN     "commonErrors" JSONB,
ADD COLUMN     "confusionWords" JSONB,
ADD COLUMN     "englishDefinition" TEXT;
