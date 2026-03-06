let cachedIp = "";
let lastFetchTime = 0;

export async function getPublicIp(): Promise<string> {
    const now = Date.now();
    if (cachedIp && now - lastFetchTime < 10000) {
        return cachedIp;
    }

    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
        throw new Error(`Failed to fetch IP: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.ip) {
        throw new Error("Invalid response from IP API");
    }

    cachedIp = data.ip;
    lastFetchTime = now;
    return data.ip;
}
