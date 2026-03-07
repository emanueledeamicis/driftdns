import fs from "fs";
import path from "path";
import type DatabaseType from "better-sqlite3";
// We must dynamically require the runtime module to prevent Next.js Turbopack from bundling it statically.
// Static bundling breaks C++ binary paths (.node files) forcing them to look inside .next/server/chunks/.
const Database = eval(`require("better-sqlite3")`) as typeof DatabaseType;
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DbClient = BetterSQLite3Database<typeof schema>;

let dbInstance: DbClient | undefined;

function initDb(): DbClient {
    if (dbInstance) {
        return dbInstance;
    }

    const dbPath =
        process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "driftdns.db");

    // Ensure the data directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(dbPath);

    // Enable WAL mode for better concurrent read performance
    sqlite.pragma?.("journal_mode = WAL");
    sqlite.pragma?.("foreign_keys = ON");

    dbInstance = drizzle(sqlite, { schema });
    return dbInstance;
}

export const db = new Proxy(
    {},
    {
        get(_target, prop) {
            return initDb()[prop as keyof DbClient];
        },
    },
) as DbClient;

export type DB = DbClient;
