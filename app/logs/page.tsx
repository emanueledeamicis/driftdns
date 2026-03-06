"use client";

import { useEffect, useState } from "react";
import { LogTable } from "@/components/log-table";

export default function LogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const res = await fetch("/api/logs?limit=500");
                if (res.ok) {
                    setLogs(await res.json());
                }
            } catch (e) {
                console.error("Failed to load logs", e);
            } finally {
                setLoading(false);
            }
        }
        fetchLogs();
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
                <p className="text-muted-foreground mt-2">History of all DDNS updates. Limited to most recent 500 events.</p>
            </div>

            {loading ? (
                <div className="text-muted-foreground animate-pulse">Loading logs...</div>
            ) : (
                <LogTable logs={logs} />
            )}
        </div>
    );
}
