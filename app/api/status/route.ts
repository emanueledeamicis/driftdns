import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getPublicIp } from "@/lib/ip";
import { db } from "@/lib/db";
import { watchedRecords, updateLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    try {
        const ip = await getPublicIp();

        // Contiamo quanti record sono abilitati per il DDNS
        const enabledRecords = await db
            .select()
            .from(watchedRecords)
            .where(eq(watchedRecords.enabled, 1))
            .all();

        // Otteniamo anche il numero totale di record inseriti a db (anche disabilitati)
        const totalRecords = await db
            .select()
            .from(watchedRecords)
            .all();

        // L'ultimo log per sapere a che ora è stato il check più recente
        const lastLog = await db
            .select()
            .from(updateLogs)
            .orderBy(desc(updateLogs.timestamp))
            .limit(1)
            .get();

        return NextResponse.json({
            currentIp: ip,
            enabledRecordsCount: enabledRecords.length,
            totalRecordsCount: totalRecords.length,
            lastCheckTimestamp: lastLog ? lastLog.timestamp : null,
        });
    } catch (error) {
        console.error("[GET /api/status] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
