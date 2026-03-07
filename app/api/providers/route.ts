import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";

export async function GET() {
    try {
        const list = await db.select({
            id: providers.id,
            type: providers.type,
            name: providers.name,
            createdAt: providers.createdAt,
        }).from(providers).all();

        return NextResponse.json(list);
    } catch (error) {
        console.error("[GET /api/providers] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, name, credentials } = body;

        if (!type || !name || !credentials) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (type !== "route53" && type !== "cloudflare") {
            return NextResponse.json({ error: "Invalid provider type" }, { status: 400 });
        }

        const encryptedCredentials = encrypt(JSON.stringify(credentials));

        const id = crypto.randomUUID();

        await db.insert(providers).values({
            id,
            type,
            name,
            encryptedCredentials,
        }).run();

        return NextResponse.json({ id, type, name }, { status: 201 });
    } catch (error) {
        console.error("[POST /api/providers] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
