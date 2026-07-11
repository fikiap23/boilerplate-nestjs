#!/bin/sh

. ./build/fix-generated-ownership.sh

echo "Generate Database"
npx prisma generate
fix_generated_ownership

echo "Migration Database"
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ] || [ "$RUN_SEED" = "1" ]; then
  echo "Seed Database"
  npx prisma db seed
fi

echo "Start Server Prod"
node build/compile/src/main.js
