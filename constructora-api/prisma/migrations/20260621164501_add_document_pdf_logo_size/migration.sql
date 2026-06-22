-- CreateEnum
CREATE TYPE "DocumentPdfLogoSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- AlterTable
ALTER TABLE "DocumentPdfSetting" ADD COLUMN     "logoSize" "DocumentPdfLogoSize" NOT NULL DEFAULT 'MEDIUM';
