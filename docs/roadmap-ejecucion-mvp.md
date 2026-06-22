# Roadmap tecnico de ejecucion MVP

## Estado actual detectado

- `constructora-app` no es todavia la app de constructora: es un starter de dashboard con Next.js 16 + shadcn + Clerk (`constructora-app/README.md`, `constructora-app/package.json`).
- El frontend ya trae auth, organizaciones, billing y RBAC apoyados en Clerk, mas pantallas demo como `products`, `users`, `kanban`, `chat` y `workspaces` (`constructora-app/src/app/dashboard/*`).
- El frontend tambien mantiene APIs mock locales en `constructora-app/src/app/api/products/*` y `constructora-app/src/app/api/users/*`, o sea: hoy no consume el backend real.
- `constructora-api` es un starter multi-tenant en NestJS con JWT propio, refresh tokens, memberships, `activeTenantId` en token y `TenantGuard` con chequeo de pertenencia (`constructora-api/src/auth/auth.service.ts`, `constructora-api/src/common/guards/tenant.guard.ts`).
- El backend tiene base util para SaaS B2B: `auth`, `tenants`, `memberships`, `rbac`, `audit`, `feature-flags`, `billing`, `notifications`, `metrics`, `tracing` (`constructora-api/src/app.module.ts`).
- El dominio de negocio del PRD todavia NO existe en codigo: no hay modulos de obras, presupuestos, gastos, clientes, proveedores ni materiales.

## Decision pendiente: identidad y tenancy

Hay un quilombo arquitectonico que hay que cerrar ANTES del sprint de features.

### Opcion A: Clerk como fuente de verdad de identidad y organizacion

- Pros: acelera login, invitaciones, org switcher y UI de equipo ya presentes en frontend.
- Contras: hay que adaptar backend para validar tokens de Clerk, mapear orgs a `Tenant`, y redefinir billing/roles para no duplicar logica.

### Opcion B: backend propio como fuente de verdad de identidad y tenancy

- Pros: alinea con el backend actual, reduce doble modelo de tenants/roles, deja reglas de negocio y seguridad en un solo lugar.
- Contras: obliga a reemplazar o encapsular partes importantes del starter frontend basado en Clerk.

### Recomendacion

Elegir **Opcion B** para el MVP. Motivo: el backend ya tiene JWT, memberships, tenant isolation y contrato multi-tenant propio; mantener Clerk + JWT propio en paralelo mete duplicacion de usuarios, roles, tenant activo y billing. Para arrancar rapido de verdad, conviene que el frontend se adapte al backend, no al reves.

## Fases MVP

### Fase 0 - Fundacion e integracion

Objetivo: dejar un stack coherente entre frontend y backend.

Incluye:
- cerrar decision de identidad/tenancy;
- definir contrato de autenticacion y tenant activo;
- reemplazar mocks criticos del frontend por integracion real;
- limpiar o aislar pantallas demo que no aportan al negocio.

Criterio de aceptacion:
- un usuario puede iniciar sesion, seleccionar tenant activo y navegar con permisos coherentes;
- el frontend deja de depender de `products/users` mock para el flujo base;
- queda definida la estrategia oficial de auth, roles y tenant switching.

### Fase 1 - Core operacional

Objetivo: cubrir el flujo minimo negocio -> presupuesto -> obra -> gasto.

Modulos:
1. clientes
2. presupuestos
3. obras
4. gastos

Criterio de aceptacion:
- se puede crear cliente;
- se puede crear presupuesto con items y estado `DRAFT/SENT/APPROVED/REJECTED`;
- un presupuesto aprobado puede originar una obra;
- se pueden cargar gastos generales o asociados a obra;
- todas las consultas quedan aisladas por tenant.

### Fase 2 - Control de ejecucion

Objetivo: gestionar avance real de obra.

Modulos:
1. etapas/plantillas de obra
2. proveedores
3. materiales
4. adjuntos basicos

Criterio de aceptacion:
- una obra puede crearse con plantilla de etapas;
- cada etapa tiene estado, avance y responsable;
- gastos y materiales pueden vincularse a obra/etapa;
- se pueden adjuntar comprobantes y fotos de avance.

### Fase 3 - Visibilidad y cierre administrativo

Objetivo: convertir datos operativos en gestion.

Modulos:
1. dashboard real
2. reportes/PDF
3. historial y trazabilidad
4. alertas clave

Criterio de aceptacion:
- dashboard con metricas reales por tenant;
- exportacion PDF de presupuesto y reporte de obra;
- acciones criticas auditadas;
- alertas minimas para presupuesto por vencer, obra atrasada y gasto pendiente.

## Orden sugerido de modulos

1. identidad + tenant activo
2. roles/permisos operativos
3. clientes
4. presupuestos
5. obras
6. gastos
7. etapas y plantillas
8. proveedores
9. materiales
10. adjuntos
11. dashboard
12. reportes y alertas

Razon: el PRD gira alrededor de convertir presupuesto en obra y medir gasto real. Si no resolves eso primero, todo lo demas es maquillaje.

## Riesgos principales

- **Doble identidad**: Clerk en frontend y JWT propio en backend pueden romper permisos, tenant activo y onboarding.
- **Falsa sensacion de avance**: hay muchas pantallas listas, pero varias son demo o mock, no producto.
- **Modelo de dominio faltante**: hoy el schema no tiene entidades de negocio de constructora.
- **Billing prematuro**: Clerk Billing y backend billing-ready existen, pero no deberian bloquear el MVP operativo.
- **Dashboard antes de datos**: si se arranca por metricas o UI, se construye humo arriba de nada.

## Entregables inmediatos del primer sprint

1. ADR corta con la decision final de identidad/tenancy.
2. Mapa de integracion frontend-backend: login, refresh, tenant activo, headers y permisos.
3. Backlog tecnico para reemplazar mocks/frontend demo por rutas reales del producto.
4. Diseno inicial del dominio MVP:
   - `Tenant`
   - `User` / `Membership`
   - `Client`
   - `Budget` / `BudgetItem`
   - `Project`
   - `Expense`
5. Definicion de estados y transiciones minimas:
   - presupuesto: `DRAFT -> SENT -> APPROVED/REJECTED`
   - obra: `PENDING -> ACTIVE -> PAUSED -> COMPLETED/CANCELLED`
   - gasto: `PENDING -> PAID/CANCELLED`
6. Corte de alcance del MVP con estas pantallas reales:
   - login
   - selector de tenant
   - listado/alta de clientes
   - listado/alta de presupuestos
   - conversion presupuesto -> obra
   - listado/alta de gastos

## Definicion de listo para empezar desarrollo

- decision de auth/tenancy cerrada;
- dominio MVP modelado;
- backlog ordenado por dependencias;
- criterio de tenant isolation definido para cada entidad nueva;
- frontend demo identificado para reemplazo o descarte.
