import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LogItem {
    id: string;
    timestamp: number;
    oldIp: string | null;
    newIp: string | null;
    success: number;
    message: string | null;
    recordName: string;
    providerName: string;
    providerType: string;
}

interface LogTableProps {
    logs: LogItem[];
}

export function LogTable({ logs }: LogTableProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Record</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>IP Change</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Message</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No logs found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => {
                            const date = new Date(log.timestamp * 1000).toLocaleString();
                            return (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                        {date}
                                    </TableCell>
                                    <TableCell className="font-medium">{log.recordName}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{log.providerName}</span>
                                            <Badge variant="outline" className="text-[10px] uppercase">
                                                {log.providerType}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs">
                                        {log.oldIp || "none"} <span className="text-muted-foreground">→</span> {log.newIp || "none"}
                                    </TableCell>
                                    <TableCell>
                                        {log.success === 1 ? (
                                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Success</Badge>
                                        ) : (
                                            <Badge variant="destructive">Failed</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={log.message || ""}>
                                        {log.message || "OK"}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
