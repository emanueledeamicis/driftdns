import {
    Route53Client,
    ListHostedZonesCommand,
    ListResourceRecordSetsCommand,
    ChangeResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import { IDnsProvider, DnsZone, DnsRecord } from "./interface";

export class Route53Provider implements IDnsProvider {
    private client: Route53Client;

    constructor(accessKeyId: string, secretAccessKey: string, region: string) {
        this.client = new Route53Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
    }

    async getZones(): Promise<DnsZone[]> {
        const command = new ListHostedZonesCommand({});
        const response = await this.client.send(command);
        return (response.HostedZones || []).map((z) => ({
            // Route53 IDs often look like "/hostedzone/Z0202838K8WSJJ5LWPSA"
            id: z.Id?.replace("/hostedzone/", "") || "",
            name: z.Name || "",
        }));
    }

    async getRecords(zoneId: string): Promise<DnsRecord[]> {
        const command = new ListResourceRecordSetsCommand({ HostedZoneId: zoneId });
        const response = await this.client.send(command);

        return (response.ResourceRecordSets || [])
            .filter((r) => r.Type === "A" || r.Type === "AAAA")
            .map((r) => ({
                id: r.Name || "", // Route53 does not have a separate record ID, we use Name
                name: r.Name || "",
                type: r.Type as string,
                value: r.ResourceRecords?.[0]?.Value || "",
                ttl: r.TTL || 300,
            }));
    }

    async updateRecord(
        zoneId: string,
        recordId: string,
        newIp: string,
        recordName: string
    ): Promise<void> {
        const isIPv6 = newIp.includes(":");
        const type = isIPv6 ? "AAAA" : "A";

        const command = new ChangeResourceRecordSetsCommand({
            HostedZoneId: zoneId,
            ChangeBatch: {
                Changes: [
                    {
                        Action: "UPSERT",
                        ResourceRecordSet: {
                            Name: recordName,
                            Type: type,
                            TTL: 300,
                            ResourceRecords: [{ Value: newIp }],
                        },
                    },
                ],
            },
        });

        await this.client.send(command);
    }
}
