# DriftDNS — Project Specification

## What is DriftDNS?

DriftDNS is a **self-hosted, open-source web dashboard** for managing Dynamic DNS (DDNS) across multiple DNS providers (AWS Route53, Cloudflare, and more in the future).

The goal is to be the **"Nginx Proxy Manager of DDNS"**: dead-simple to deploy via Docker, with a clean web UI to manage all zones and records without ever editing config files manually.

### Problem it solves

Right now, managing DDNS on Route53 or Cloudflare requires:
- One Docker container per DNS zone (in the `crazymax/ddns-route53` approach)
- Hand-editing `docker-compose.yml` every time you add a new record
- No UI, no logs visible, no quick overview

DriftDNS replaces this with a single container + a web dashboard.

---

## Tech Stack (all decisions are final, do not change)

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | SQLite via **Drizzle ORM** |
| **Scheduler** | `node-cron` (runs server-side at Next.js startup) |
| **AWS Provider SDK** | `@aws-sdk/client-route-53` |
| **Cloudflare Provider SDK** | `cloudflare` npm package |
| **Credential encryption** | Node.js built-in `crypto` module (AES-256-GCM) |
| **Container** | Docker, base image `node:22-alpine` |
| **Package manager** | pnpm |

---

## Project Structure

```
driftdns/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout with sidebar nav
│   │   ├── page.tsx                # Dashboard (status overview)
│   │   ├── providers/
│   │   │   └── page.tsx            # Add/remove DNS providers
│   │   ├── zones/
│   │   │   └── page.tsx            # Browse zones & records, enable DDNS
│   │   └── logs/
│   │       └── page.tsx            # Update history logs
│   ├── app/api/                    # REST API routes
│   │   ├── providers/
│   │   │   └── route.ts            # GET, POST, DELETE providers
│   │   ├── zones/
│   │   │   └── route.ts            # GET zones for a provider
│   │   ├── records/
│   │   │   └── route.ts            # GET records for a zone, PATCH to enable DDNS
│   │   └── logs/
│   │       └── route.ts            # GET update logs
│   ├── lib/
│   │   ├── providers/
│   │   │   ├── interface.ts        # IDnsProvider interface
│   │   │   ├── route53.ts          # AWS Route53 implementation
│   │   │   ├── cloudflare.ts       # Cloudflare implementation
│   │   │   └── factory.ts          # getProvider(type, credentials) factory
│   │   ├── scheduler.ts            # node-cron: IP detection + record updates
│   │   ├── ip.ts                   # Detect public IP via https://api.ipify.org
│   │   ├── crypto.ts               # AES-256-GCM encrypt/decrypt for credentials
│   │   └── db/
│   │       ├── schema.ts           # Drizzle schema (providers, watched_records, update_logs)
│   │       ├── index.ts            # DB connection singleton
│   │       └── migrations/         # Drizzle migration files
│   └── components/                 # shadcn/ui + custom components
│       ├── sidebar.tsx
│       ├── provider-card.tsx
│       ├── record-table.tsx
│       └── log-table.tsx
├── drizzle.config.ts
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Database Schema (Drizzle + SQLite)

```ts
// src/lib/db/schema.ts

// DNS providers configured by the user
providers = {
  id: text (PK, cuid),
  type: text,               // 'route53' | 'cloudflare'
  name: text,               // friendly name, e.g. "My Cloudflare account"
  encryptedCredentials: text, // JSON blob, AES-256-GCM encrypted
  createdAt: integer,       // unix timestamp
}

// Records that have DDNS enabled
watchedRecords = {
  id: text (PK, cuid),
  providerId: text (FK → providers.id),
  zoneId: text,             // provider-specific zone ID
  zoneName: text,           // e.g. "example.com"
  recordId: text,           // provider-specific record ID
  recordName: text,         // e.g. "home.example.com"
  schedule: text,           // cron expression, default "*/30 * * * *"
  enabled: integer,         // 0 | 1
  lastKnownIp: text,        // last IP successfully set
  createdAt: integer,
}

// Log of every update attempt
updateLogs = {
  id: text (PK, cuid),
  watchedRecordId: text (FK → watchedRecords.id),
  timestamp: integer,
  oldIp: text,
  newIp: text,
  success: integer,         // 0 | 1
  message: text,            // error message if failed
}
```

---

## Provider Abstraction Layer

Every DNS provider implements this interface:

```ts
// src/lib/providers/interface.ts

export interface DnsZone {
  id: string;
  name: string;
}

export interface DnsRecord {
  id: string;
  name: string;
  type: string;   // 'A' | 'AAAA'
  value: string;  // current IP
  ttl: number;
}

export interface IDnsProvider {
  getZones(): Promise<DnsZone[]>;
  getRecords(zoneId: string): Promise<DnsRecord[]>;
  updateRecord(zoneId: string, recordId: string, newIp: string): Promise<void>;
}
```

### Route53 credentials shape (stored encrypted):
```json
{
  "accessKeyId": "AKIA...",
  "secretAccessKey": "...",
  "region": "us-east-1"
}
```

### Cloudflare credentials shape (stored encrypted):
```json
{
  "apiToken": "..."
}
```

---

## DDNS Scheduler

- Lives in `src/lib/scheduler.ts`
- Must be initialized **once** at server startup (use Next.js `instrumentation.ts` — the `register()` hook)
- For each enabled `watchedRecord`:
  1. Detect current public IP via `https://api.ipify.org?format=json`
  2. If IP === `lastKnownIp` → do nothing
  3. If different → call `provider.updateRecord(...)` → write to `updateLogs` → update `lastKnownIp`
- Handles each record on its own cron schedule
- Schedule changes take effect on next application restart (acceptable for v1)

---

## Credential Encryption

All provider credentials are stored encrypted in SQLite. Never store them in plain text.

```ts
// src/lib/crypto.ts
// Uses Node.js crypto: AES-256-GCM
// The encryption key is derived from DRIFTDNS_SECRET env variable
// (must be set by the user in docker-compose.yml)

encrypt(plaintext: string): string  // returns base64 ciphertext
decrypt(ciphertext: string): string
```

---

## API Routes

| Method | Path | Description |
|---|---|---|
| GET | `/api/providers` | List all configured providers |
| POST | `/api/providers` | Add a new provider (encrypts credentials) |
| DELETE | `/api/providers/[id]` | Remove a provider and its watched records |
| GET | `/api/zones?providerId=` | Fetch zones from provider API |
| GET | `/api/records?providerId=&zoneId=` | Fetch records from provider API |
| PATCH | `/api/records/watch` | Enable/disable DDNS on a record |
| GET | `/api/logs` | Get update log history (paginated) |
| GET | `/api/status` | Current public IP + last update timestamps |

---

## UI Pages

### Dashboard (`/`)
- Current detected public IP
- Number of watched records (enabled/total)
- Last N update events (success/failure)
- Quick "Force update now" button

### Providers (`/providers`)
- List of configured providers with type badge (Route53 / Cloudflare)
- "Add Provider" form: select type → fill credentials → save
- Delete provider button (with confirmation: also deletes watched records)

### Zones & Records (`/zones`)
- Select a provider → browse its zones → browse records in zone
- Each A/AAAA record has a toggle: "Enable DDNS"
- When enabled, the record appears in the watched list with its schedule

### Logs (`/logs`)
- Table: Timestamp | Record | Old IP | New IP | Status | Message
- Filter by provider, zone, record, success/failure

---

## Docker

### Dockerfile
```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### docker-compose.yml
```yaml
services:
  driftdns:
    image: driftdns:latest
    build: .
    ports:
      - "3000:3000"
    environment:
      - DRIFTDNS_SECRET=change-me-to-a-random-32-char-string
    volumes:
      - driftdns_data:/app/data
    restart: unless-stopped

volumes:
  driftdns_data:
```

### .env.example
```
DRIFTDNS_SECRET=change-me-to-a-random-32-char-string
DATABASE_PATH=/app/data/driftdns.db
```

---

## Implementation Notes

1. **Next.js standalone output**: Use `output: 'standalone'` in `next.config.ts` for a minimal Docker image.
2. **SQLite file path**: Read from `DATABASE_PATH` env var, default to `./data/driftdns.db`. The `/data` folder is the mounted Docker volume.
3. **Drizzle migrations**: Run automatically at startup using `db.migrate()` before the scheduler initializes.
4. **Only A and AAAA records**: Filter records in provider implementations — DDNS only makes sense for A and AAAA records.
5. **Error handling**: All scheduler errors must be caught and logged to `updateLogs` with `success: false`. The app must never crash due to a failed update.
6. **Hosted Zone ID vs Zone Name**: Route53 uses an opaque Hosted Zone ID (e.g. `Z0202838K8WSJJ5LWPSA`), Cloudflare uses a Zone ID too. The `zoneName` in the DB is just for display purposes.
7. **UI design**: Dark mode first. Use shadcn/ui components. The dashboard should feel premium, not minimal. Color scheme: dark background, accent in indigo/violet.

---

## First milestone (MVP)

1. [ ] Project scaffold (Next.js 15 + Tailwind + shadcn/ui + Drizzle + SQLite)
2. [ ] DB schema + migrations
3. [ ] Credential encryption utility
4. [ ] Cloudflare provider implementation
5. [ ] Route53 provider implementation
6. [ ] Provider factory
7. [ ] All API routes
8. [ ] DDNS scheduler with `node-cron` + `instrumentation.ts`
9. [ ] Dashboard UI (all 4 pages)
10. [ ] Dockerfile + docker-compose
11. [ ] README with setup instructions
