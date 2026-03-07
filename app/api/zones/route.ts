import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getProvider } from "@/lib/providers/factory";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const providerId = searchParams.get("providerId");

        if (!providerId) {
            return NextResponse.json({ error: "Missing providerId param" }, { status: 400 });
        }

        const providerRecord = await db
            .select()
            .from(providers)
            .where(eq(providers.id, providerId))
            .get();

        if (!providerRecord) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        const dnsProvider = getProvider(providerRecord.type, providerRecord.encryptedCredentials);
        const zones = await dnsProvider.getZones();

        return NextResponse.json(zones);
    } catch (error) {
        console.error("[GET /api/zones] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
