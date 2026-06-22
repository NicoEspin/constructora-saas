-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "projectIncomeId" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_projectIncomeId_idx" ON "Attachment"("projectIncomeId");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_projectIncomeId_fkey" FOREIGN KEY ("projectIncomeId") REFERENCES "ProjectIncome"("id") ON DELETE SET NULL ON UPDATE CASCADE;
