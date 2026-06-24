#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required for Prisma runtime access."
  exit 1
fi

if [ -z "${DIRECT_URL:-}" ]; then
  echo "ERROR: DIRECT_URL is required for production migrations on Render."
  echo "Set DIRECT_URL to a direct PostgreSQL connection string, not a pooled/proxied URL."
  exit 1
fi

echo "Applying Prisma migrations with prisma migrate deploy..."
npx prisma migrate deploy
