#!/bin/sh

echo "Generate Database"
npx prisma generate

echo "Migration Database"
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ] || [ "$RUN_SEED" = "1" ]; then
  echo "Seed Database"
  npx prisma db seed
fi

echo "Start Server Prod"
node dist/src/main.js
