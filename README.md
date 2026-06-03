# Gohite BizSphere

Multi-business unified shop management for **Gohite Krishi Seva Kendra** and **Gohite Hardware Hub**.

## Documentation

- [DOCUMENTATION.md](DOCUMENTATION.md) — technical SSOT
- [POLICY.md](POLICY.md) — business rules SSOT

## Fully configurable

Operational rules are **not hardcoded**. Admins change behavior from **Settings** (`/settings`) without redeploying:

- GST defaults, expiry alert days, pagination limits
- Allowed units and payment types (JSON arrays)
- Feature flags: POS, bulk upload
- Invoice display name and footer text

Config registry: `shared/src/configRegistry.js`. See [POLICY.md](POLICY.md) §8 and [DOCUMENTATION.md](DOCUMENTATION.md) §4b.

## Quick start

```bash
cp .env.example .env
docker compose up -d db
npm install
npm run db:migrate -w backend
npm run db:seed -w backend
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api/health

**Demo login:** `admin@gohite.com` / `Admin@123`

## Tests

```bash
npm test
```

## Backup

```bash
export DATABASE_URL=postgresql://...
./scripts/backup.sh
```
