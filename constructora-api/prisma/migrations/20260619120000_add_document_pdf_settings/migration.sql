-- CreateEnum
CREATE TYPE "DocumentPdfType" AS ENUM ('BUDGET');

-- CreateEnum
CREATE TYPE "DocumentPdfLayout" AS ENUM ('CLASSIC', 'ACCENT', 'COMPACT');

-- CreateTable
CREATE TABLE "DocumentPdfSetting" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "documentType" "DocumentPdfType" NOT NULL,
    "layout" "DocumentPdfLayout" NOT NULL DEFAULT 'CLASSIC',
    "primaryColor" TEXT NOT NULL,
    "logoAttachmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentPdfSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPdfSetting_tenantId_documentType_key" ON "DocumentPdfSetting"("tenantId", "documentType");

-- CreateIndex
CREATE INDEX "DocumentPdfSetting_tenantId_idx" ON "DocumentPdfSetting"("tenantId");

-- CreateIndex
CREATE INDEX "DocumentPdfSetting_logoAttachmentId_idx" ON "DocumentPdfSetting"("logoAttachmentId");

-- AddForeignKey
ALTER TABLE "DocumentPdfSetting" ADD CONSTRAINT "DocumentPdfSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentPdfSetting" ADD CONSTRAINT "DocumentPdfSetting_logoAttachmentId_fkey" FOREIGN KEY ("logoAttachmentId") REFERENCES "Attachment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
