import { defineConfig } from "drizzle-kit";
import path from "path";

const dbPath =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "driftdns.db");

export default defineConfig({
    schema: "./lib/db/schema.ts",
    out: "./lib/db/migrations",
    dialect: "sqlite",
    dbCredentials: {
        url: dbPath,
    },
});
