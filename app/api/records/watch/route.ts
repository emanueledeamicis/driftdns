import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { watchedRecords, updateLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
                        id: crypto.randomUUID(),
                        providerId,
                        zoneId,
                        zoneName,
                        recordId,
                        recordName,
                        schedule: schedule || "*/30 * * * *",
                        enabled: 1,
                        lastKnownIp: null, // will be populated by the scheduler
                    })
                    .run();
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

        // Since we changed the watched records, ideally we'd signal the scheduler. 
        // For MVP, user must restart container or wait for sync (as per specs).

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[PATCH /api/records/watch] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
