#!/bin/sh

set -e

echo "Waiting for MySQL to be ready..."

until nc -z boilerplate-nest-database-mysql-dev 3306; do
  echo "MySQL not ready yet, retrying..."
  sleep 3
done

echo "MySQL is up!"

echo "Generate Prisma Client"
npx prisma generate

echo "Start Server Dev"
npm run start:dev
