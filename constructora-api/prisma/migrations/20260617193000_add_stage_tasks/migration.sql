-- CreateTable
CREATE TABLE "ProjectTemplateStageTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectTemplateStageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTemplateStageTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStageTask" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectStageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectStageTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectTemplateStageTask_projectTemplateStageId_position_key" ON "ProjectTemplateStageTask"("projectTemplateStageId", "position");

-- CreateIndex
CREATE INDEX "ProjectTemplateStageTask_tenantId_idx" ON "ProjectTemplateStageTask"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectTemplateStageTask_projectTemplateStageId_idx" ON "ProjectTemplateStageTask"("projectTemplateStageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectStageTask_projectStageId_position_key" ON "ProjectStageTask"("projectStageId", "position");

-- CreateIndex
CREATE INDEX "ProjectStageTask_tenantId_idx" ON "ProjectStageTask"("tenantId");

-- CreateIndex
CREATE INDEX "ProjectStageTask_projectStageId_idx" ON "ProjectStageTask"("projectStageId");

-- CreateIndex
CREATE INDEX "ProjectStageTask_tenantId_completed_idx" ON "ProjectStageTask"("tenantId", "completed");

-- AddForeignKey
ALTER TABLE "ProjectTemplateStageTask" ADD CONSTRAINT "ProjectTemplateStageTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTemplateStageTask" ADD CONSTRAINT "ProjectTemplateStageTask_projectTemplateStageId_fkey" FOREIGN KEY ("projectTemplateStageId") REFERENCES "ProjectTemplateStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStageTask" ADD CONSTRAINT "ProjectStageTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStageTask" ADD CONSTRAINT "ProjectStageTask_projectStageId_fkey" FOREIGN KEY ("projectStageId") REFERENCES "ProjectStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
