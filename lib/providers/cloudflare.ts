import Cloudflare from "cloudflare";
import { IDnsProvider, DnsZone, DnsRecord } from "./interface";

export class CloudflareProvider implements IDnsProvider {
    private client: Cloudflare;

    constructor(apiToken: string) {
        this.client = new Cloudflare({ apiToken });
    }

    async getZones(): Promise<DnsZone[]> {
        const zones = await this.client.zones.list();
        return (zones.result || []).map((z) => ({
            id: z.id,
            name: z.name,
        }));
    }

    async getRecords(zoneId: string): Promise<DnsRecord[]> {
        const records = await this.client.dns.records.list({ zone_id: zoneId });
        return (records.result || [])
            .filter((r) => r.type === "A" || r.type === "AAAA")
            .map((r) => ({
                id: r.id!,
                name: r.name,
                type: r.type as "A" | "AAAA",
                value: r.content as string,
                ttl: r.ttl as number,
            }));
    }

    async updateRecord(
        zoneId: string,
        recordId: string,
        newIp: string,
        recordName: string
    ): Promise<void> {
        const isIPv6 = newIp.includes(":");

        if (isIPv6) {
            await this.client.dns.records.edit(recordId, {
                zone_id: zoneId,
                content: newIp,
                name: recordName,
                type: "AAAA",
                ttl: 1,
            });
        } else {
            await this.client.dns.records.edit(recordId, {
                zone_id: zoneId,
                content: newIp,
                name: recordName,
                type: "A",
                ttl: 1,
            });
        }
    }
}
