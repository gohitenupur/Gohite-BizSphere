# DOCUMENTATION.md — Technical Reference (SSOT)

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-03 | Initial: stack, schema, APIs, pagination, backup, env |
| 1.1.0 | 2026-06-03 | Configuration API, Settings UI, config registry in shared package |

## 1. Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL 15+
- **Auth:** JWT (Bearer)
- **PDF:** pdfkit
- **Excel:** xlsx

## 2. Monorepo layout

```
shared/     — Zod metadata schemas
backend/    — API + Prisma
frontend/   — React UI
scripts/    — backup.sh
```

## 3. Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `JWT_EXPIRES_IN` | No | Default `7d` |
| `PORT` | No | API port, default `3001` |
| `CORS_ORIGIN` | No | Frontend URL, default `http://localhost:5173` |
| `DEFAULT_PAGE_SIZE` | No | Default `25` |
| `MAX_PAGE_SIZE` | No | Default `100` |
| `ENABLE_BULK_UPLOAD` | No | Default `true` |

## 4. API conventions

- Base path: `/api`
- Auth header: `Authorization: Bearer <token>`
- Tenant header: `X-Business-ID: <uuid>`
- List response: `{ data: [], meta: { page, pageSize, total, totalPages } }`
- Errors: `{ error: string, details?: object }`

### Endpoints (v1.0)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/businesses` | Yes | List accessible businesses |
| GET | `/api/products` | Yes + tenant | Paginated products |
| POST | `/api/products` | Yes + tenant | Create product |
| PUT | `/api/products/:id` | Yes + tenant | Update product |
| DELETE | `/api/products/:id` | Yes + tenant | Soft delete |
| GET | `/api/products/alerts/expiring` | Yes + tenant | Krishi expiry alerts |
| POST | `/api/stock/adjust` | Yes + tenant | Stock adjustment |
| POST | `/api/sales` | Yes + tenant | Create sale |
| GET | `/api/sales` | Yes + tenant | Paginated sales |
| GET | `/api/sales/:id/pdf` | Yes + tenant | Invoice PDF |
| POST | `/api/excel/upload` | Yes + tenant | Bulk product upload |
| GET | `/api/reports/sales-summary` | Yes + tenant | Sales summary |
| GET | `/api/config/effective` | Yes + tenant | Resolved config for active business |
| GET | `/api/config/definitions` | Yes + tenant (Admin/Manager) | Config metadata + current values |
| PUT | `/api/config` | Yes + tenant (Admin) | Update single config key |
| PUT | `/api/config/bulk` | Yes + tenant (Admin) | Update multiple config keys |

## 4b. Configuration system

- Registry: `shared/src/configRegistry.js` (all valid keys, types, defaults)
- Storage: `SystemConfig` table (`businessId` null = global)
- Resolution: business-specific value overrides global default
- UI: `/settings` (Admin only)

## 5. Database tables (backup checklist)

All tables MUST be included in `scripts/backup.sh`:

- User, UserBusiness, Business, Category, Product, StockMovement, Sale, SaleItem, AuditLog, SystemConfig
- `_prisma_migrations`

## 6. Row Level Security

RLS enabled on tenant-scoped tables. Session variable `app.business_id` set per request via `tenantMiddleware`.

## 7. Pagination

- Query: `page`, `pageSize`, `sort`, `order`, `search`
- Default `pageSize`: 25; max: 100

## 8. Backup & restore

```bash
# Backup (all tables)
./scripts/backup.sh

# Restore
psql $DATABASE_URL < backups/gohite_YYYYMMDD_HHMMSS.sql
```

## 9. Rollback

1. Restore database from latest backup
2. Redeploy previous application image/tag
3. Run pending migrations only after review

## 10. Local development

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Default seed admin: `admin@gohite.com` / `Admin@123` (change in production).
