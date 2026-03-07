import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

type DbClient = LibSQLDatabase<typeof schema>;

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

    const client = createClient({ url: `file:${dbPath}` });

    dbInstance = drizzle(client, { schema });
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
