"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Globe, ShieldCheck, Clock } from "lucide-react";
import { LogTable } from "@/components/log-table";

export default function DashboardPage() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statusRes, logsRes] = await Promise.all([
          fetch("/api/status"),
          fetch("/api/logs?limit=5"),
        ]);
        if (statusRes.ok) setStatus(await statusRes.json());
        if (logsRes.ok) setLogs(await logsRes.json());
      } catch (e) {
        console.error("Failed to load dashboard data", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your DriftDNS instance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public IP</CardTitle>
            <Globe className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tighter">{status?.currentIp || "Unknown"}</div>
            <p className="text-xs text-muted-foreground mt-1">Detected externally</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active DDNS Records</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tighter">{status?.enabledRecordsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of {status?.totalRecordsCount || 0} configured</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <ShieldCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-medium">Scheduler Online</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                Last check: {status?.lastCheckTimestamp
                  ? new Date(status.lastCheckTimestamp * 1000).toLocaleString()
                  : "Never"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Last 5 DDNS update attempts.</p>
        </div>
        <LogTable logs={logs} />
      </div>
    </div>
  );
}
