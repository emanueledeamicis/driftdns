export async function getPublicIp(): Promise<string> {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
        throw new Error(`Failed to fetch IP: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.ip) {
        throw new Error("Invalid response from IP API");
    }
    return data.ip;
}
