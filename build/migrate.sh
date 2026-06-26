#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
sleep 10

echo "Generate Prisma Client"
npx prisma generate
. ./build/fix-generated-ownership.sh
fix_generated_ownership

echo "Create Migration File"
npx prisma migrate dev --name db_migration --create-only

echo "Migration Done"
