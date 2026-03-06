export interface DnsZone {
    id: string;
    name: string;
}

export interface DnsRecord {
    id: string;
    name: string;
    type: string;
    value: string;
    ttl: number;
}

export interface IDnsProvider {
    getZones(): Promise<DnsZone[]>;
    getRecords(zoneId: string): Promise<DnsRecord[]>;
    updateRecord(zoneId: string, recordId: string, newIp: string, recordName: string): Promise<void>;
}
