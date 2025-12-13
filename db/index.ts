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
import env from "@/env";

export const connection = postgres(env.DATABASE_URL, {
  max: (env.DB_MIGRATING || env.DB_SEEDING) ? 1 : undefined,
  onnotice: env.DB_SEEDING ? () => {} : undefined,
});

export const db = drizzle(connection, {
  schema,
  logger: true,
});

export type db = typeof db;

export default db;