"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RecordTable } from "@/components/record-table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ZonesPage() {
    const [providers, setProviders] = useState<any[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>("");
    const [zones, setZones] = useState<any[]>([]);
    const [selectedZone, setSelectedZone] = useState<string>("");
    const [records, setRecords] = useState<any[]>([]);

    const [loadingProviders, setLoadingProviders] = useState(true);
    const [loadingZones, setLoadingZones] = useState(false);
    const [loadingRecords, setLoadingRecords] = useState(false);

    useEffect(() => {
        async function fetchProviders() {
            try {
                const res = await fetch("/api/providers");
                if (res.ok) {
                    const data = await res.json();
                    setProviders(data);
                    if (data.length > 0) setSelectedProvider(data[0].id);
                }
            } catch (e) {
                toast.error("Failed to load providers");
            } finally {
                setLoadingProviders(false);
            }
        }
        fetchProviders();
    }, []);

    useEffect(() => {
        if (!selectedProvider) return;
        async function fetchZones() {
            setLoadingZones(true);
            setZones([]);
            setSelectedZone("");
            setRecords([]);
            try {
                const res = await fetch(`/api/zones?providerId=${selectedProvider}`);
                if (res.ok) {
                    const data = await res.json();
                    setZones(data);
                } else {
                    toast.error("Failed to load zones");
                }
            } catch (e) {
                toast.error("Error connecting to server");
            } finally {
                setLoadingZones(false);
            }
        }
        fetchZones();
    }, [selectedProvider]);

    useEffect(() => {
        if (!selectedProvider || !selectedZone) return;
        async function fetchRecords() {
            setLoadingRecords(true);
            try {
                const res = await fetch(`/api/records?providerId=${selectedProvider}&zoneId=${selectedZone}`);
                if (res.ok) {
                    setRecords(await res.json());
                } else {
                    toast.error("Failed to load records");
                }
            } catch (e) {
                toast.error("Error connecting to server");
            } finally {
                setLoadingRecords(false);
            }
        }
        fetchRecords();
    }, [selectedProvider, selectedZone]);

    async function handleToggleWatch(record: any, watch: boolean) {
        const zoneName = zones.find((z) => z.id === selectedZone)?.name || "Unknown";

        // Optimistic UI update
        setRecords(records.map(r => r.id === record.id ? { ...r, isWatched: watch, enabled: watch } : r));

        try {
            const res = await fetch("/api/records/watch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    providerId: selectedProvider,
                    zoneId: selectedZone,
                    zoneName,
                    recordId: record.id,
                    recordName: record.name,
                    action: watch ? "watch" : "unwatch",
                    schedule: "*/30 * * * *" // default
                })
            });

            if (res.ok) {
                toast.success(watch ? `DDNS enabled for ${record.name}` : `DDNS disabled for ${record.name}`);
            } else {
                throw new Error("API Error");
            }
        } catch (e) {
            toast.error("Failed to update status");
            // Revert optimistic update
            setRecords(records.map(r => r.id === record.id ? { ...r, isWatched: !watch, enabled: !watch } : r));
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Zones & Records</h1>
                <p className="text-muted-foreground mt-2">Enable Dynamic DNS on your A/AAAA records.</p>
            </div>

            <div className="p-6 border rounded-lg bg-card">
                <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
                    <div className="grid gap-2">
                        <Label>Select Provider</Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={loadingProviders || providers.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={providers.length === 0 ? "No providers available" : "Select a provider"} />
                            </SelectTrigger>
                            <SelectContent>
                                {providers.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Select Zone</Label>
                        <Select value={selectedZone} onValueChange={setSelectedZone} disabled={!selectedProvider || loadingZones || zones.length === 0}>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingZones ? "Loading..." : "Select a zone to view records"} />
                            </SelectTrigger>
                            <SelectContent>
                                {zones.map((z) => (
                                    <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {loadingRecords ? (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
            ) : selectedZone ? (
                <div className="space-y-4 animate-in fade-in">
                    <div>
                        <h2 className="text-xl font-semibold">Records</h2>
                        <p className="text-sm text-muted-foreground mb-4">Toggle DDNS to automatically keep the record's IP address up to date.</p>
                    </div>
                    <RecordTable records={records} onToggleWatch={handleToggleWatch} />
                </div>
            ) : null}
        </div>
    );
}
