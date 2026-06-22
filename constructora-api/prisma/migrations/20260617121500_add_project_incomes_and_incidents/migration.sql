-- CreateTable
CREATE TABLE "ProjectIncome" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "paymentMethod" "PaymentMethod",
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectIncome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectIncident" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "delayHours" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectIncome_tenantId_idx" ON "ProjectIncome"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectIncome_projectId_idx" ON "ProjectIncome"("projectId");

-- CreateIndex
CREATE INDEX "ProjectIncome_tenantId_projectId_idx" ON "ProjectIncome"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectIncome_tenantId_receivedAt_idx" ON "ProjectIncome"("tenantId", "receivedAt");

-- CreateIndex
CREATE INDEX "ProjectIncident_tenantId_idx" ON "ProjectIncident"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectIncident_projectId_idx" ON "ProjectIncident"("projectId");

-- CreateIndex
CREATE INDEX "ProjectIncident_tenantId_projectId_idx" ON "ProjectIncident"("tenantId", "projectId");

-- CreateIndex
CREATE INDEX "ProjectIncident_tenantId_incidentDate_idx" ON "ProjectIncident"("tenantId", "incidentDate");

-- AddForeignKey
ALTER TABLE "ProjectIncome" ADD CONSTRAINT "ProjectIncome_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIncome" ADD CONSTRAINT "ProjectIncome_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIncident" ADD CONSTRAINT "ProjectIncident_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectIncident" ADD CONSTRAINT "ProjectIncident_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
