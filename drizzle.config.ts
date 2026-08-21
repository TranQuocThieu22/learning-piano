import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit is a standalone CLI — unlike Next.js it does NOT load .env.local
// automatically, so we load it explicitly here.
config({ path: '.env.local' });

// Prefer the direct (unpooled) connection for DDL: schema changes run more
// reliably outside PgBouncer. Falls back to the pooled URL if it isn't set.
const connectionString =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Make sure .env.local exists in the project root and contains DATABASE_URL.'
  );
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
});
