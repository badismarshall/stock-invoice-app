// // import { drizzle } from 'drizzle-orm/postgres-js';
// // import postgres from "postgres";
// import { drizzle } from 'drizzle-orm/better-sqlite3';
// import Database from 'better-sqlite3';
// // import env from "@/env";

// // export const connection = postgres(env.DATABASE_URL, {
// //   max: (env.DB_MIGRATING || env.DB_SEEDING) ? 1 : undefined,
// //   onnotice: env.DB_SEEDING ? () => {} : undefined,
// // });

// const sqlite = new Database(process.env.DB_FILE_NAME!);
// const db = drizzle({ 
//   client: sqlite,
// });

// export default db;


import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from "postgres";
import * as schema from '@/db/schema';

// Ensure .env is loaded before creating connection
// This ensures DATABASE_URL is loaded from .env file
const databaseUrl = 'postgresql://neondb_owner:npg_9moCqwOVFD8d@ep-crimson-voice-agd41st0-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Please check your .env file.');
}

export const connection = postgres(databaseUrl, {
  max: (process.env.DB_MIGRATING === 'true' || process.env.DB_SEEDING === 'true') ? 1 : undefined,
  onnotice: process.env.DB_SEEDING === 'true' ? () => {} : undefined,
});

export const db = drizzle(connection, {
  schema,
  logger: true,
});

export type db = typeof db;

export default db;