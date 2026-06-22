-- CreateEnum
CREATE TYPE "ProjectIncidentCategory" AS ENUM ('WEATHER', 'SUPPLIER', 'CLIENT', 'PERMIT', 'MATERIALS', 'WORKFORCE', 'TECHNICAL', 'SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectIncomeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "actualEndDate" TIMESTAMP(3),
ADD COLUMN     "actualStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProjectIncident" ADD COLUMN     "category" "ProjectIncidentCategory",
ADD COLUMN     "projectStageId" TEXT;

-- AlterTable
ALTER TABLE "ProjectIncome" ADD COLUMN     "budgetId" TEXT,
ADD COLUMN     "status" "ProjectIncomeStatus" NOT NULL DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "ProjectStage" ADD COLUMN     "actualEndDate" TIMESTAMP(3),
ADD COLUMN     "actualStartDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Expense_tenantId_status_dueDate_idx" ON "Expense"("tenantId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "ProjectIncident_projectStageId_idx" ON "ProjectIncident"("projectStageId");

-- CreateIndex
CREATE INDEX "ProjectIncident_tenantId_category_idx" ON "ProjectIncident"("tenantId", "category");

-- CreateIndex
CREATE INDEX "ProjectIncome_budgetId_idx" ON "ProjectIncome"("budgetId");

-- CreateIndex
CREATE INDEX "ProjectIncome_tenantId_status_idx" ON "ProjectIncome"("tenantId", "status");

-- AddForeignKey
ALTER TABLE "ProjectIncome" ADD CONSTRAINT "ProjectIncome_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIncident" ADD CONSTRAINT "ProjectIncident_projectStageId_fkey" FOREIGN KEY ("projectStageId") REFERENCES "ProjectStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
