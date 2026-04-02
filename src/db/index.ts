import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

let _db: Database | undefined;

export function getDb(d1?: D1Database): Database {
  if (_db) return _db;
  if (!d1) {
    throw new Error("D1 database binding is required for first initialization");
  }
  _db = drizzle(d1, { schema });
  return _db;
}

export { schema };
