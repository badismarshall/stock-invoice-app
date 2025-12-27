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
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Please check your .env file.');
}

export const connection = postgres(process.env.DATABASE_URL, {  // databaseUrl
  max: (process.env.DB_MIGRATING === 'true' || process.env.DB_SEEDING === 'true') ? 1 : undefined,
  onnotice: process.env.DB_SEEDING === 'true' ? () => {} : undefined,
});

export const db = drizzle(connection, {
  schema,
  logger: true,
});

export type db = typeof db;

export default db;