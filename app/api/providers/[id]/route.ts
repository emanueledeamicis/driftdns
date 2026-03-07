import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { providers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id;

        if (!id) {
            return NextResponse.json({ error: "Missing provider ID" }, { status: 400 });
        }

        // Cascade delete on watched_records and update_logs is handled by SQLite foreign keys (PRAGMA foreign_keys = ON)
        await db.delete(providers).where(eq(providers.id, id)).run();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[DELETE /api/providers/[id]] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
