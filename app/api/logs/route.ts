import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { updateLogs, watchedRecords, providers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit") || "100";
        const limit = parseInt(limitParam, 10);

        const logs = db
            .select({
                id: updateLogs.id,
                timestamp: updateLogs.timestamp,
                oldIp: updateLogs.oldIp,
                newIp: updateLogs.newIp,
                success: updateLogs.success,
                message: updateLogs.message,
                recordName: watchedRecords.recordName,
                providerName: providers.name,
                providerType: providers.type,
            })
            .from(updateLogs)
            .innerJoin(watchedRecords, eq(updateLogs.watchedRecordId, watchedRecords.id))
            .innerJoin(providers, eq(watchedRecords.providerId, providers.id))
            .orderBy(desc(updateLogs.timestamp))
            .limit(limit)
            .all();

        return NextResponse.json(logs);
    } catch (error) {
        console.error("[GET /api/logs] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
