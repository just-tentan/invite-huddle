import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";

const connectionString = process.env.DATABASE_URL!;
const needsSsl = !connectionString.includes("sslmode=disable");

const client = postgres(connectionString, {
  ssl: needsSsl ? { rejectUnauthorized: false } : false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
export const db = drizzle(client, { schema });

export type DB = typeof db;
