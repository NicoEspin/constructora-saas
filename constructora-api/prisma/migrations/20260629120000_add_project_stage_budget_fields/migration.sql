ALTER TABLE "ProjectStage"
ADD COLUMN     "budgetQuantity" DECIMAL(12, 2),
ADD COLUMN     "budgetUnit" "MeasurementUnit" NOT NULL DEFAULT 'M2';
