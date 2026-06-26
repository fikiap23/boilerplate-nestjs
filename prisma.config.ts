import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    // Fallback allows `prisma generate` during install when .env is not present.
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:postgres@localhost:5432/postgres',
  },
});
