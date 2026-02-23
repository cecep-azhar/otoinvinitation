import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url       = process.env.TURSO_URL       ?? "file:local.db";   // SQLite lokal jika TURSO_URL tidak ada
const authToken = process.env.TURSO_AUTH_TOKEN ?? undefined;

const client = createClient({ url, authToken });
export const db = drizzle(client, { schema });
