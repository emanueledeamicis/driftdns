export async function register() {
    if (process.env.NEXT_PHASE === "phase-production-build") return;

    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { migrate } = await import("drizzle-orm/libsql/migrator");
        const { db } = await import("./lib/db");
        const path = await import("path");

        console.log("[DriftDNS] Running database migrations...");
        try {
            migrate(db, { migrationsFolder: path.join(process.cwd(), "lib", "db", "migrations") });
            console.log("[DriftDNS] Migrations completed successfully.");
        } catch (error) {
            console.error("[DriftDNS] Failed to run migrations:", error);
        }

        // Inizializza lo scheduler DDNS
        const { initScheduler } = await import("./lib/scheduler");
        await initScheduler();
    }
}
