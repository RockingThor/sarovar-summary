-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "softOpeningDate" TIMESTAMP(3),
ADD COLUMN     "softOpeningDateSubmitted" BOOLEAN NOT NULL DEFAULT false;
