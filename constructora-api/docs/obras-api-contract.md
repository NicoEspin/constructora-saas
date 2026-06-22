# Obras API Contract

## Scope

Backend contract for the `projects` domain in `constructora-api`.

This revision keeps existing endpoints compatible and extends responses with richer operational and financial summary data.

## Schema Changes

### Project

- `actualStartDate?: string`
- `actualEndDate?: string`

### ProjectStage

- `actualStartDate?: string`
- `actualEndDate?: string`

### ProjectIncident

- `projectStageId?: string`
- `category?: ProjectIncidentCategory`

`ProjectIncidentCategory`:

- `WEATHER`
- `SUPPLIER`
- `CLIENT`
- `PERMIT`
- `MATERIALS`
- `WORKFORCE`
- `TECHNICAL`
- `SAFETY`
- `OTHER`

### Expense

- `dueDate?: string`

### ProjectIncome

- `status: ProjectIncomeStatus`
- `budgetId?: string`

`ProjectIncomeStatus`:

- `PENDING`
- `CONFIRMED`
- `CANCELLED`

## Validation Rules

### Project dates

- `startDate <= estimatedEndDate` when both exist.
- `actualStartDate <= actualEndDate` when both exist.

### Stage dates

- `estimatedStartDate <= estimatedEndDate` when both exist.
- `actualStartDate <= actualEndDate` when both exist.
- Stage dates outside project range are allowed, but they emit summary warnings.

### Stage progress normalization

- `COMPLETED` always normalizes to `progressPercent = 100`.
- `progressPercent = 100` auto-normalizes status to `COMPLETED`.
- `PENDING` normalizes to `progressPercent = 0`.
- Create without explicit status and `progressPercent > 0` defaults to `IN_PROGRESS`.
- Update without explicit status preserves current status except when `progressPercent = 100` or a completed stage is moved back below `100`.

### Tenant-scoped references

- `project.clientId`, `project.projectTemplateId`, `project.managerUserId`
- `stage.managerUserId`, `stage.projectTemplateStageId`
- `projectIncome.projectId`, `projectIncome.budgetId`
- `projectIncident.projectId`, `projectIncident.projectStageId`
- `expense.categoryId`, `expense.projectId`, `expense.projectStageId`, `expense.supplierId`

Additional rules:

- `projectIncome.budgetId` must belong to the same tenant.
- If that budget is already linked to a different project, the request is rejected.
- `projectIncident.projectStageId` must belong to the same tenant and the same project.

## Progress Calculation

- If no stage has weight, project progress uses a simple average.
- If all stages have weights and the sum is exactly `100`, project progress uses the weighted average.
- If weights are partial or their sum is not `100`, backend falls back to a simple average and emits alerts/warnings.

## Financial Calculation Rules

- `totalCollectedAmount`: compatibility field, now mirrors confirmed collected money.
- `confirmedCollectedAmount`: sum of incomes with `CONFIRMED`.
- `pendingCollectedAmount`: sum of incomes with `PENDING`.
- `cancelledCollectedAmount`: sum of incomes with `CANCELLED`.
- `totalRecordedExpenseAmount`: sum of expenses where status is not `CANCELLED`.
- `paidExpenseAmount`: sum of expenses with `PAID`.
- `pendingExpenseAmount`: sum of expenses with `PENDING`.
- `overdueExpenseAmount`: sum of `PENDING` expenses where `dueDate < now`.
- `cancelledExpenseAmount`: sum of expenses with `CANCELLED`.
- `realGrossMarginAmount = confirmedCollectedAmount - paidExpenseAmount`.
- `projectedGrossMarginAmount = approvedBudgetAmount - totalRecordedExpenseAmount` when there is an approved budget.
- `remainingToCollectAmount = approvedBudgetAmount - confirmedCollectedAmount` when there is an approved budget.
- `budgetVsExpenseDeviationAmount = totalRecordedExpenseAmount - approvedBudgetAmount` when there is an approved budget.
- `budgetVsExpenseDeviationPercent = deviation / approvedBudgetAmount * 100` when there is an approved budget.

## Budget Selection Rule

Summary chooses a budget source in this order:

1. Latest `APPROVED` budget.
2. Latest budget whose status is not `REJECTED`.
3. Latest budget overall.

Exposed fields:

- `approvedBudgetAmount`
- `latestBudgetAmount`
- `selectedBudgetId`
- `selectedBudgetStatus`

## Timeline and Delay Rules

- `ProjectIncident.projectStageId` is optional.
- `totalDelayHours = sum(delayDays * 24 + delayHours)`.
- `totalDelayDays = totalDelayHours / 24` rounded to 2 decimals.
- `adjustedEstimatedEndDate = project.estimatedEndDate + totalDelayHours`.
- Backend never mutates `estimatedEndDate`; adjustment is summary-only.

## Endpoints

### Existing endpoints extended

- `GET /api/projects/:id`
  - Keeps existing project payload.
  - Extends `summary` with richer fields described below.

- `POST /api/projects`
- `PATCH /api/projects/:id`
- `POST /api/projects/:projectId/stages`
- `PATCH /api/projects/:projectId/stages/:stageId`
- `POST /api/project-incomes`
- `PATCH /api/project-incomes/:id`
- `POST /api/project-incidents`
- `PATCH /api/project-incidents/:id`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`

These endpoints now accept the new optional fields documented above.

### New endpoint

- `GET /api/projects/:id/summary`
  - Returns the same enriched summary object included in `GET /api/projects/:id`.

## ProjectSummary Shape

```json
{
  "progressPercent": 85,
  "totalCollectedAmount": "1000",
  "confirmedCollectedAmount": "1000",
  "pendingCollectedAmount": "300",
  "cancelledCollectedAmount": "200",
  "totalRecordedExpenseAmount": "750",
  "paidExpenseAmount": "400",
  "pendingExpenseAmount": "350",
  "overdueExpenseAmount": "100",
  "cancelledExpenseAmount": "50",
  "approvedBudgetAmount": "1200",
  "latestBudgetAmount": "1500",
  "selectedBudgetId": "budget-id",
  "selectedBudgetStatus": "APPROVED",
  "remainingToCollectAmount": "200",
  "realGrossMarginAmount": "600",
  "projectedGrossMarginAmount": "450",
  "budgetVsExpenseDeviationAmount": "-450",
  "budgetVsExpenseDeviationPercent": -37.5,
  "realizedGrossMarginAmount": "600",
  "realizedGrossMarginPercent": 60,
  "estimatedBudgetMarginAmount": "150",
  "estimatedBudgetMarginPercent": 12.5,
  "estimatedBudgetMarginBudgetName": "Presupuesto Aprobado",
  "estimatedBudgetMarginSource": "latest-approved-budget",
  "incidentCount": 2,
  "totalDelayHours": 36,
  "totalDelayDays": 1.5,
  "adjustedEstimatedEndDate": "2026-07-02T12:00:00.000Z",
  "stagesCount": 4,
  "completedStagesCount": 1,
  "inProgressStagesCount": 2,
  "pendingStagesCount": 1,
  "blockedStagesCount": 0,
  "alerts": [
    {
      "code": "OVERDUE_PENDING_EXPENSES",
      "message": "La obra tiene gastos pendientes vencidos.",
      "meta": { "count": 1 }
    }
  ],
  "warnings": [
    {
      "code": "INCONSISTENT_WEIGHT_CONFIGURATION",
      "message": "La configuracion de pesos es inconsistente; se uso promedio simple."
    }
  ]
}
```

## Alert Objects

Common shape:

```json
{
  "code": "STRING_CODE",
  "message": "Human readable message",
  "meta": {}
}
```

Current alert codes:

- `PROJECT_WITHOUT_APPROVED_BUDGET`
- `EXPENSES_WITHOUT_BUDGET`
- `INCOMES_WITHOUT_BUDGET`
- `STAGES_MISSING_ESTIMATED_DATES`
- `PARTIAL_STAGE_WEIGHTS`
- `STAGE_WEIGHTS_SUM_NOT_100`
- `OVERDUE_PENDING_EXPENSES`
- `ACCUMULATED_INCIDENT_DELAYS`
- `PROJECT_OVERDUE`
- `OVERDUE_STAGES`
- `NEGATIVE_REAL_GROSS_MARGIN`
- `EXPENSES_OVER_APPROVED_BUDGET`

Current warning codes:

- `STAGE_DATES_OUTSIDE_PROJECT_RANGE`
- `INCONSISTENT_WEIGHT_CONFIGURATION`

## Example `GET /api/projects/:id`

```json
{
  "id": "project-id",
  "tenantId": "tenant-id",
  "name": "Obra Financiera",
  "startDate": "2026-06-01T00:00:00.000Z",
  "actualStartDate": "2026-06-03T00:00:00.000Z",
  "estimatedEndDate": "2026-07-01T00:00:00.000Z",
  "actualEndDate": null,
  "status": "ACTIVE",
  "progressPercent": 85,
  "summary": {
    "progressPercent": 85,
    "totalCollectedAmount": "1000",
    "confirmedCollectedAmount": "1000",
    "pendingCollectedAmount": "300",
    "cancelledCollectedAmount": "200",
    "totalRecordedExpenseAmount": "750",
    "paidExpenseAmount": "400",
    "pendingExpenseAmount": "350",
    "overdueExpenseAmount": "100",
    "cancelledExpenseAmount": "50",
    "approvedBudgetAmount": "1200",
    "latestBudgetAmount": "1500",
    "selectedBudgetId": "budget-id",
    "selectedBudgetStatus": "APPROVED",
    "remainingToCollectAmount": "200",
    "realGrossMarginAmount": "600",
    "projectedGrossMarginAmount": "450",
    "budgetVsExpenseDeviationAmount": "-450",
    "budgetVsExpenseDeviationPercent": -37.5,
    "totalDelayHours": 36,
    "totalDelayDays": 1.5,
    "adjustedEstimatedEndDate": "2026-07-02T12:00:00.000Z",
    "stagesCount": 4,
    "completedStagesCount": 1,
    "inProgressStagesCount": 2,
    "pendingStagesCount": 1,
    "blockedStagesCount": 0,
    "alerts": [],
    "warnings": []
  }
}
```

## Optional Fields

- `actualStartDate`, `actualEndDate`
- `projectIncident.projectStageId`
- `projectIncident.category`
- `expense.dueDate`
- `projectIncome.budgetId`
- `summary.approvedBudgetAmount`
- `summary.latestBudgetAmount`
- `summary.remainingToCollectAmount`
- `summary.projectedGrossMarginAmount`
- `summary.budgetVsExpenseDeviationAmount`
- `summary.budgetVsExpenseDeviationPercent`
- `summary.adjustedEstimatedEndDate`

When no approved budget exists, budget-derived summary fields are `null`.

## Pending / Debt

- `GET /api/projects/:id/timeline` was intentionally not added in this revision to avoid duplicating summary logic before there is a clear timeline contract.
- `Attachment` was not extended with `projectIncomeId` / `projectIncidentId` yet because there is no backend attachment module in `src` and adding foreign keys now would expand an untested surface.
