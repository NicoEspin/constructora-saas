# AGENTS.md

## Project Overview

Multi-tenant construction management SaaS backoffice.

**Frontend:** Next.js App Router · TypeScript · shadcn/ui · Tailwind CSS · React Query · Zustand
**Backend:** NestJS · TypeScript · Prisma · PostgreSQL · Redis · JWT/Refresh tokens
**Domain:** tenants, users, roles, permissions, projects/obras, clients, suppliers, materials, budgets, expenses, invoices, daily reports, documents, dashboards.

---

## Working Rules

Before making changes:

1. Read the existing code structure first.
2. Identify if the task touches frontend, backend, DB, auth, permissions or multi-tenancy.
3. Reuse existing conventions before introducing new patterns.
4. Prefer small, focused changes over large rewrites.
5. Never modify unrelated files.
6. Never introduce new dependencies without clear justification.
7. Never remove security checks, tenant scoping, validations or tests.
8. Verify the result before declaring the task complete.

---

## Skill Usage Policy

**Skills are mandatory, not optional.** If a task touches an area covered by a skill, consult that skill before implementing.

Use `find-skills` when:
- The task requires knowledge not covered by installed skills.
- A new technology, package or framework appears.
- You're unsure which skill applies.

---

## Skills Reference

| Situation | Skill |
|---|---|
| Routes, App Router, layouts, server/client components, data fetching, caching | `next-best-practices` |
| React components, hooks, state, re-renders, hydration | `vercel-react-best-practices` |
| Reusable UI, tables, modals, drawers, forms, composition patterns | `vercel-composition-patterns` |
| shadcn/ui components, forms, dialogs, sheets, dropdowns | `shadcn` |
| Design tokens, themes, dark mode, CSS variables, spacing, colors | `tailwind-design-system` |
| New screens, dashboards, visual hierarchy, premium UI | `frontend-design` |
| UI audit before delivery: spacing, a11y, responsive, UX | `web-design-guidelines` |
| New backend modules, domain boundaries, architecture decisions | `improve-codebase-architecture` |
| Bug with unclear cause, unexpected query results, broken auth/tenant | `diagnose` |
| Complex bugs, race conditions, cross-layer issues, repeated failed fixes | `systematic-debugging` |
| DTOs, domain types, discriminated unions, API types, refactoring `any` | `typescript-advanced-types` |
| Prisma schema, migrations, indexes, query optimization, pagination | `supabase-postgres-best-practices` |
| New backend modules, business rules, permission logic, tenant isolation | `tdd` |
| User flows, CRUD tests, login, tenant switching, forms, role restrictions | `webapp-testing` |
| Before declaring any task complete | `verification-before-completion` |

---

## Frontend Rules

### Next.js
- Prefer Server Components by default.
- Use Client Components only for interactivity, browser APIs, local state or event handlers.
- Keep route structure predictable.
- No business logic inside page components.
- Use loading and error boundaries where appropriate.

### React
- Keep components focused and composable.
- Avoid unnecessary `useEffect`.
- Don't duplicate server state in local state.
- Prefer derived state.
- Don't memoize blindly.
- Avoid prop drilling when a store/context is clearer.

### Components
- Prefer composition over large boolean-prop components.
- Feature components stay inside their feature folder.
- Generic UI components are domain-agnostic.
- Don't create abstractions until a pattern appears more than twice.

### shadcn/ui
- Use the shadcn CLI whenever possible.
- Don't invent component paths.
- Wrap shadcn primitives instead of heavily modifying them.
- Preserve Radix/shadcn accessibility behavior.

### Design
- Clarity over decoration.
- Strong hierarchy for enterprise workflows.
- Every screen needs a clear primary action.
- Empty states must guide the user toward an action.
- Tables and forms must be easy to scan.
- UI must support daily operational use, not only look good in demos.

### Forms
- Use shadcn form patterns + Zod (or the existing validation approach).
- Show field-level errors.
- Disable submit while submitting.
- Show success/error feedback.
- Never silently fail.

### Tables
- Use TanStack Table if already present.
- Paginate for large datasets.
- Include search/filter where operationally useful.
- Respect role permissions in row actions.
- Never render unbounded datasets.

### Dashboard
- All metrics must be tenant-scoped.
- Cards must link to their related section.
- Avoid vanity metrics without operational value.

**Useful construction dashboard metrics:**
- Active projects / projects by status
- Pending budgets
- Monthly expenses
- Upcoming deadlines
- Materials low in stock
- Pending supplier payments
- Recent daily reports

---

## Backend Rules

### Architecture
- Vertical modules by domain.
- Controllers are thin: validate input, call service, return response.
- Business logic lives in services.
- Database access isolated in repositories or scoped Prisma calls.
- No circular dependencies.
- No god services.
- Tenant-aware logic is always explicit.

```
src/modules/
  projects/
    projects.controller.ts
    projects.service.ts
    projects.repository.ts
    dto/
    entities/
    tests/
  budgets/
  materials/
  suppliers/
  daily-reports/
  expenses/
  invoices/
```

### Controllers
- Validate input with DTOs.
- Use guards for auth/tenant/permissions.
- Return consistent response shapes.
- No business logic.

### Services
- One domain responsibility per service.
- Tenant context must be explicit in every operation.
- Use transactions for multi-step writes.
- Throw meaningful exceptions.

### DTOs
- Validate all incoming data.
- Never accept `tenantId` from request body for tenant-owned creates.
- Use enums or literal unions for controlled states.
- Keep DTOs specific to the action.

```ts
export class CreateProjectDto {
  name: string;
  description?: string;
  address?: string;
  startDate?: string;
  endDate?: string;
}
// tenantId is always assigned from context in the service, never from DTO
```

### TypeScript
- No `any`.
- No unsafe type assertions.
- Prefer explicit domain types.
- Use enums or literal unions for domain states.
- Validate runtime data — TypeScript alone is not validation.

```ts
type ProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';
```

---

## Multi-Tenancy Rules

Multi-tenancy is a critical security boundary. No exceptions.

1. Every tenant-owned entity must have `tenantId`.
2. Every query for tenant-owned data must filter by `tenantId`.
3. Every create must assign `tenantId` from authenticated context.
4. Every update/delete must verify ownership via `tenantId`.
5. Never trust `tenantId` from the request body.
6. If `X-Tenant-ID` header is used, validate that the user belongs to that tenant.
7. Never expose data across tenants in search, exports or dashboards.
8. Super-admin/global operations must be explicit and isolated.
9. Add tenant isolation tests in critical modules.

```ts
// Bad
await prisma.project.findMany();

// Good
await prisma.project.findMany({ where: { tenantId: ctx.tenantId } });

// Bad
await prisma.project.update({ where: { id }, data });

// Good
await prisma.project.update({
  where: { id_tenantId: { id, tenantId: ctx.tenantId } },
  data,
});
```

Required pattern for tenant-owned models:

```prisma
model Project {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
}
```

---

## Auth & Authorization Rules

- JWT access tokens + refresh tokens following the existing backend pattern.
- Never store secrets in the frontend.
- Validate permissions on the backend — frontend guards are UX only.
- Every protected backend route uses proper guards.
- Role/permission checks are centralized and testable.
- Never rely only on route hiding in the sidebar.

**Common roles:** `OWNER` · `ADMIN` · `MANAGER` · `MEMBER` · `VIEWER`

**Permission surface:**
```
projects.read / create / update / delete
budgets.read / create / approve
materials.read / create / update
expenses.read / create / approve
reports.read / create
users.invite / update
settings.update
```

---

## API Integration Rules

- Keep API client logic centralized.

```
src/lib/api/
  client.ts
  auth.ts
  projects.ts
  budgets.ts
  materials.ts
```

- Use React Query for server state.
- Use Zustand only for client/UI state or session UI state (e.g. active tenant in the UI).
- Handle loading, error and empty states in every data-dependent component.
- Use consistent pagination, filters and sorting.
- Every request needing tenant context must include:

```ts
headers: {
  Authorization: `Bearer ${accessToken}`,
  'X-Tenant-ID': activeTenantId,
}
```

---

## Database Rules

- Use migrations for all schema changes.
- Never manually edit generated migration files without documented reason.
- Run Prisma validation after every schema edit.
- Add indexes for `tenantId` and common search fields.
- Avoid nullable fields unless the domain requires them.
- Use `Decimal` for money — never `Float`.
- Prefer soft delete/archive for business records where history matters.
- Use transactions for multi-step writes.
- Always paginate list queries.

```prisma
estimatedCost Decimal? @db.Decimal(12, 2)
actualCost    Decimal? @db.Decimal(12, 2)
```

---

## Security Rules

- Never commit secrets or expose `.env` values.
- Never log tokens, passwords or sensitive data.
- Validate and sanitize all user-provided input.
- Rate-limit sensitive endpoints.
- Backend permission checks are required for every protected action.
- Keep audit logs for critical operations.

**Auditable operations:**
- User invited / role changed
- Project created / updated / deleted
- Budget approved
- Expense approved
- Invoice marked as paid
- Tenant settings changed

---

## Construction Domain

Core entities:

```
Tenant / Construction Company
User · Membership · Role · Permission

Project / Obra
Client · Supplier · Employee / Worker
Material · Inventory Item
Budget / Presupuesto · Budget Item
Expense · Purchase
Invoice · Payment
Daily Report / Parte Diario
Document · Task
```

Key business rules:

- A project belongs to one tenant.
- A budget belongs to one project with statuses: `DRAFT` → `SENT` → `APPROVED` / `REJECTED`.
- Approved budgets are not freely editable — require a controlled flow.
- Expenses belong to a project when applicable.
- Daily reports link to project, date and author.

---

## Suggested Implementation Order

When building from scratch:

1. Auth (JWT, refresh tokens)
2. Tenant selection + active tenant context
3. Users, roles, permissions
4. Projects / obras
5. Clients
6. Suppliers
7. Materials and inventory
8. Budgets
9. Expenses and purchases
10. Daily reports
11. Documents
12. Dashboard metrics
13. Audit logs and advanced reporting

Don't start dashboards before the underlying data model is stable.

---

## Verification Before Completion

**Mandatory before declaring any task done.**

```bash
# Frontend
npm run lint
npm run typecheck
npm run build

# Backend
npm run lint
npm run test
npm run build

# After Prisma schema changes
npx prisma format
npx prisma validate
npx prisma migrate dev
```

Inspect `package.json` for the correct commands if they differ. If verification couldn't run, state why explicitly.

---

## Completion Checklist

```
[ ] Code follows existing project conventions
[ ] TypeScript types are safe — no any, no unsafe assertions
[ ] All tenant-owned data is scoped by tenantId
[ ] Backend permissions enforced on every protected route
[ ] Forms validate input and show field-level errors
[ ] UI has loading / error / empty states where relevant
[ ] Database changes include migrations and indexes
[ ] Relevant tests added or updated
[ ] lint / typecheck / tests / build passed
[ ] No secrets, temp logs or unrelated changes introduced
```

---

## When to Ask for Clarification

Ask only when a decision would significantly change the implementation:

- Incompatible auth strategies
- Changes to the multi-tenancy model
- New paid services or infrastructure
- Changing the database provider
- Removing existing features
- Irreversible data model decisions

For minor implementation details: make a reasonable decision based on existing patterns and document it inline.

---

## Reporting Back

When completing a task:

1. Summarize what changed.
2. List files modified.
3. State which verification commands ran and their result.
4. Note anything that couldn't be verified and why.
5. Mention follow-up work only if genuinely relevant.

Never say "done" unless verification completed or the limitation is clearly stated.