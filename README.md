# DriftDNS

DriftDNS is a self-hosted, open-source web dashboard for managing Dynamic DNS (DDNS) across multiple DNS providers. This MVP supports AWS Route53 and Cloudflare.

## Features
- **Clean Web UI**: Manage everything from the browser without editing config files.
- **Multi-provider**: Add multiple AWS and Cloudflare accounts securely.
- **AES-256-GCM Encryption**: Rest assured your API keys are fully encrypted in the database.
- **Node-Cron Scheduler**: IP detection is automated and background-managed.
- **Nginx Proxy Manager style UX**: Simple, straightforward setup via Docker.

## Deployment with Docker (Recommended)

1. Clone the repository
   ```bash
   git clone https://github.com/your-repo/driftdns.git
   cd driftdns
   ```

2. Configure environment (Important)
   Edit the `docker-compose.yml` to change the `DRIFTDNS_SECRET` variable to a strong random string (e.g. 32 chars). This is used as the encryption key for your stored API credentials.

3. Start the container
   ```bash
   docker compose up -d
   ```

4. Access the Dashboard
   Open your browser to `http://localhost:3000`

## Development

```bash
pnpm install
pnpm dev
```
By default, the SQLite database is created locally inside the `./data` directory.

## Build

```bash
pnpm build
pnpm start
```
