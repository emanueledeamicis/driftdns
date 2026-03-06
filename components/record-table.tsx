"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface RecordItem {
    id: string;
    name: string;
    type: string;
    value: string;
    ttl: number;
    isWatched: boolean;
    enabled: boolean;
    schedule: string;
    lastKnownIp: string | null;
}

interface RecordTableProps {
    records: RecordItem[];
    onToggleWatch: (record: RecordItem, watch: boolean) => void;
}

export function RecordTable({ records, onToggleWatch }: RecordTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Current IP (API)</TableHead>
                        <TableHead>Last Known IP (DB)</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">DDNS</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                No A/AAAA records found in this zone.
                            </TableCell>
                        </TableRow>
                    ) : (
                        records.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell className="font-medium">{record.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{record.type}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">{record.value}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {record.lastKnownIp || "—"}
                                </TableCell>
                                <TableCell>
                                    {record.isWatched && record.enabled ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            {record.schedule}
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">—</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {record.isWatched && record.enabled ? (
                                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
                                    ) : (
                                        <Badge variant="secondary">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Switch
                                        checked={record.isWatched && record.enabled}
                                        onCheckedChange={(checked) => onToggleWatch(record, checked)}
                                        aria-label="Toggle DDNS"
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
