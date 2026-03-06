import { IDnsProvider } from "./interface";
import { CloudflareProvider } from "./cloudflare";
import { Route53Provider } from "./route53";
import { decrypt } from "../crypto";

export function getProvider(
    type: string,
    encryptedCredentials: string
): IDnsProvider {
    const jsonString = decrypt(encryptedCredentials);
    const credentials = JSON.parse(jsonString);

    if (type === "cloudflare") {
        if (!credentials.apiToken) {
            throw new Error("Missing apiToken for Cloudflare provider");
        }
        return new CloudflareProvider(credentials.apiToken);
    }

    if (type === "route53") {
        if (
            !credentials.accessKeyId ||
            !credentials.secretAccessKey ||
            !credentials.region
        ) {
            throw new Error("Missing credentials for Route53 provider");
        }
        return new Route53Provider(
            credentials.accessKeyId,
            credentials.secretAccessKey,
            credentials.region
        );
    }

    throw new Error(`Unsupported provider type: ${type}`);
}
