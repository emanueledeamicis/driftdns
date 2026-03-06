import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { watchedRecords, updateLogs, providers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getPublicIp } from "@/lib/ip";
import { getProvider } from "@/lib/providers/factory";

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { providerId, zoneId, zoneName, recordId, recordName, action, schedule } = body;

        if (!providerId || !zoneId || !zoneName || !recordId || !recordName || !action) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (action === "watch") {
            const existing = db
                .select()
                .from(watchedRecords)
                .where(
                    and(
                        eq(watchedRecords.providerId, providerId),
                        eq(watchedRecords.zoneId, zoneId),
                        eq(watchedRecords.recordId, recordId)
                    )
                )
                .get();

            let recordInternalId = existing?.id || crypto.randomUUID();

            if (existing) {
                // Update schedule/enabled status
                db.update(watchedRecords)
                    .set({
                        schedule: schedule || existing.schedule,
                        enabled: 1,
                    })
                    .where(eq(watchedRecords.id, existing.id))
                    .run();
            } else {
                // Insert new watched record
                db.insert(watchedRecords)
                    .values({
                        id: recordInternalId,
                        providerId,
                        zoneId,
                        zoneName,
                        recordId,
                        recordName,
                        schedule: schedule || "*/30 * * * *",
                        enabled: 1,
                        lastKnownIp: null, // will be populated below
                    })
                    .run();
            }

            // --- Immediate update execution ---
            try {
                const provider = db.select().from(providers).where(eq(providers.id, providerId)).get();
                if (provider) {
                    const currentIp = await getPublicIp();

                    if (!existing || existing.lastKnownIp !== currentIp) {
                        const dnsProvider = getProvider(provider.type, provider.encryptedCredentials);
                        await dnsProvider.updateRecord(zoneId, recordId, currentIp, recordName);

                        db.insert(updateLogs).values({
                            id: crypto.randomUUID(),
                            watchedRecordId: recordInternalId,
                            oldIp: existing?.lastKnownIp || null,
                            newIp: currentIp,
                            success: 1,
                            message: "Immediate initialization update successful",
                        }).run();

                        db.update(watchedRecords)
                            .set({ lastKnownIp: currentIp })
                            .where(eq(watchedRecords.id, recordInternalId))
                            .run();
                    }
                }
            } catch (err) {
                console.error("[Watch Route] Immediate update failed:", err);
                const errorMessage = err instanceof Error ? err.message : String(err);
                db.insert(updateLogs).values({
                    id: crypto.randomUUID(),
                    watchedRecordId: recordInternalId,
                    oldIp: existing?.lastKnownIp || null,
                    newIp: null, // we don't know if the new IP was applied if it failed
                    success: 0,
                    message: `Immediate init failed: ${errorMessage}`,
                }).run();
            }
        } else if (action === "unwatch") {
            const existing = db
                .select()
                .from(watchedRecords)
                .where(
                    and(
                        eq(watchedRecords.providerId, providerId),
                        eq(watchedRecords.zoneId, zoneId),
                        eq(watchedRecords.recordId, recordId)
                    )
                )
                .get();

            if (existing) {
                db.delete(watchedRecords).where(eq(watchedRecords.id, existing.id)).run();
                // Logs are cascade deleted
            }
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PATCH /api/records/watch] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
