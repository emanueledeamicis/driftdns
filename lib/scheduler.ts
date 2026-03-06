import * as cron from "node-cron";
import { db } from "./db";
import { watchedRecords, providers, updateLogs } from "./db/schema";
import { eq, and } from "drizzle-orm";
import { getPublicIp } from "./ip";
import { getProvider } from "./providers/factory";

// Mantieni i task attivi in memoria per poterli cancellare in caso di ricaricamento (opzionale per v1, ma utile in sviluppo)
const scheduledTasks: cron.ScheduledTask[] = [];

export function initScheduler() {
    console.log("[Scheduler] Initializing...");

    // Ferma tutti i task esistenti se presente (utile per hot reload in dev)
    scheduledTasks.forEach((task) => task.stop());
    scheduledTasks.length = 0;

    try {
        const records = db
            .select({
                record: watchedRecords,
                provider: providers,
            })
            .from(watchedRecords)
            .innerJoin(providers, eq(watchedRecords.providerId, providers.id))
            .where(eq(watchedRecords.enabled, 1))
            .all();

        console.log(`[Scheduler] Found ${records.length} enabled records to watch.`);

        for (const { record, provider } of records) {
            if (!cron.validate(record.schedule)) {
                console.error(`[Scheduler] Invalid cron schedule for record ${record.recordName}: ${record.schedule}`);
                continue;
            }

            const task = cron.schedule(record.schedule, async () => {
                console.log(`[Scheduler] Running check for ${record.recordName}...`);
                try {
                    const currentIp = await getPublicIp();

                    if (currentIp === record.lastKnownIp) {
                        console.log(`[Scheduler] IP unchanged for ${record.recordName} (${currentIp}). Skipping.`);
                        return;
                    }

                    console.log(`[Scheduler] IP changed for ${record.recordName}: ${record.lastKnownIp || "none"} -> ${currentIp}. Updating...`);

                    const dnsProvider = getProvider(provider.type, provider.encryptedCredentials);
                    await dnsProvider.updateRecord(record.zoneId, record.recordId, currentIp, record.recordName);

                    // Update success
                    db.insert(updateLogs)
                        .values({
                            id: crypto.randomUUID(),
                            watchedRecordId: record.id,
                            oldIp: record.lastKnownIp,
                            newIp: currentIp,
                            success: 1,
                            message: "Update successful",
                        })
                        .run();

                    db.update(watchedRecords)
                        .set({ lastKnownIp: currentIp })
                        .where(eq(watchedRecords.id, record.id))
                        .run();

                    console.log(`[Scheduler] Successfully updated ${record.recordName} to ${currentIp}.`);
                } catch (error) {
                    console.error(`[Scheduler] Error updating ${record.recordName}:`, error);

                    const errorMessage = error instanceof Error ? error.message : String(error);

                    db.insert(updateLogs)
                        .values({
                            id: crypto.randomUUID(),
                            watchedRecordId: record.id,
                            oldIp: record.lastKnownIp,
                            newIp: null, // we don't know if the new IP was applied if it failed entirely
                            success: 0,
                            message: errorMessage,
                        })
                        .run();
                }
            });

            scheduledTasks.push(task);
        }
    } catch (error) {
        console.error("[Scheduler] Error during initialization:", error);
    }
}
