import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { providers, watchedRecords } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getProvider } from "@/lib/providers/factory";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const providerId = searchParams.get("providerId");
        const zoneId = searchParams.get("zoneId");

        if (!providerId || !zoneId) {
            return NextResponse.json({ error: "Missing providerId or zoneId param" }, { status: 400 });
        }

        const providerRecord = db
            .select()
            .from(providers)
            .where(eq(providers.id, providerId))
            .get();

        if (!providerRecord) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        // Fetch records from external DNS provider
        const dnsProvider = getProvider(providerRecord.type, providerRecord.encryptedCredentials);
        const records = await dnsProvider.getRecords(zoneId);

        // Fetch DB records to check which ones are watched
        const watched = db
            .select({
                recordId: watchedRecords.recordId,
                enabled: watchedRecords.enabled,
                schedule: watchedRecords.schedule,
                lastKnownIp: watchedRecords.lastKnownIp,
            })
            .from(watchedRecords)
            .where(
                and(
                    eq(watchedRecords.providerId, providerId),
                    eq(watchedRecords.zoneId, zoneId)
                )
            )
            .all();

        const watchedMap = new Map(watched.map((w) => [w.recordId, w]));

        // Merge external API data with our watched state
        const result = records.map((r) => {
            const w = watchedMap.get(r.id);
            return {
                ...r,
                isWatched: !!w,
                enabled: w ? w.enabled === 1 : false,
                schedule: w ? w.schedule : "*/30 * * * *",
                lastKnownIp: w ? w.lastKnownIp : null,
            };
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[GET /api/records] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
