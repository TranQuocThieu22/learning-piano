import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import { env } from '@/lib/env';

// `prepare: false` is required for connection poolers (Neon, Supabase, PgBouncer in
// transaction mode) that don't support prepared statements.
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
