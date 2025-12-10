-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'NOT_APPLICABLE';

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "importance" TEXT NOT NULL DEFAULT 'Med',
ADD COLUMN     "keyWords" TEXT[],
ADD COLUMN     "scoring" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
