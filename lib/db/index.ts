// Turbopack native binary bypass
const Database = process.env.NEXT_PHASE === "phase-production-build"
    ? function () { return {} }
    : eval(`require("better-sqlite3")`);
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import * as schema from "./schema";

const dbPath =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "driftdns.db");

// Ensure the data directory exists
import fs from "fs";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
sqlite.pragma?.("journal_mode = WAL");
sqlite.pragma?.("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
