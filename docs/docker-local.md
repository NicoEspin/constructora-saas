# Docker Local

## Estado

- El `docker-compose.yml` existente en `constructora-api/` sirve mas para backend + observabilidad.
- Para levantar el proyecto completo en local, usá `docker-compose.local.yml` desde la raiz del repo.

## Servicios

- `postgres` en `localhost:5432`
- `redis` en `localhost:6379`
- `api` en `http://localhost:3000`
- `web` en `http://localhost:3001`
- `dbgate` opcional con profile `tools` en `http://localhost:3100`

## Levantar el stack

```bash
docker compose -f docker-compose.local.yml up --build
```

Con herramientas opcionales:

```bash
docker compose -f docker-compose.local.yml --profile tools up --build
```

## Bajar el stack

```bash
docker compose -f docker-compose.local.yml down
```

Borrando volumenes:

```bash
docker compose -f docker-compose.local.yml down -v
```

## Notas

- El backend corre `prisma migrate deploy` al iniciar.
- El frontend usa `BACKEND_URL=http://api:3000` dentro de Docker y expone la UI en `localhost:3001` para no chocar con la API.
- El frontend local usa el flujo auth propio del backend via `/api/auth/*`; no depende de Clerk para el login base de este stack.
- Si querés usar Sentry o tooling extra, agregalo despues. Para local, dejé lo minimo correcto.
