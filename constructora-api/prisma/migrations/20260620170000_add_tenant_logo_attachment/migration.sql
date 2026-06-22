ALTER TABLE "Tenant"
ADD COLUMN "logoAttachmentId" TEXT;

CREATE INDEX "Tenant_logoAttachmentId_idx" ON "Tenant"("logoAttachmentId");

ALTER TABLE "Tenant"
ADD CONSTRAINT "Tenant_logoAttachmentId_fkey"
FOREIGN KEY ("logoAttachmentId") REFERENCES "Attachment"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
