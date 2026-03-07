import fs from "fs";
import path from "path";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type DbClient = BetterSQLite3Database<typeof schema>;

let dbInstance: DbClient | undefined;

function initDb(): DbClient {
    if (dbInstance) {
        return dbInstance;
    }

    // Load native modules lazily at runtime to avoid build-time native binding resolution.
    const Database = eval('require("better-sqlite3")') as new (filename: string) => {
        pragma?: (value: string) => unknown;
    };
    const { drizzle } = eval('require("drizzle-orm/better-sqlite3")') as {
        drizzle: (client: unknown, options: { schema: typeof schema }) => DbClient;
    };

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
