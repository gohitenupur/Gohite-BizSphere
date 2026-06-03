# POLICY.md — Business Logic (SSOT)

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-03 | Initial policy: roles, tenant, stock, GST, audit, lifecycle |
| 1.1.0 | 2026-06-03 | Fully configurable system via SystemConfig + Admin Settings UI |
| 1.2.0 | 2026-06-03 | Align version; no policy changes (technical automation release) |

## 1. Roles & RBAC

| Role | Code | Permissions |
|------|------|-------------|
| Admin | `ADMIN` | User management, system config, all businesses, audit log read, all CRUD |
| Manager | `MANAGER` | Inventory CRUD, stock adjust, sales, reports, bulk upload; no user admin |
| Employee | `EMPLOYEE` | POS billing, read inventory, limited stock view |

**Legacy mapping:** `OWNER` → `ADMIN`; `OPERATOR` → `EMPLOYEE`.

## 2. Multi-tenant rules

- Every authenticated API call (except `/api/health`, `/api/auth/login`) MUST include `X-Business-ID`.
- Users may only access businesses assigned via `UserBusiness` (Admin may access all).
- Cross-tenant data access is forbidden.

## 3. Inventory & stock

- Stock quantity cannot go below zero on sale (reject with 409).
- Stock movements are append-only; never deleted.
- Product delete is **soft delete** (`deletedAt`); hidden from default lists.
- Krishi products SHOULD include `metadata.expiryDate` when applicable.

## 4. GST

- GST percentage stored per product; default from `SystemConfig` key `default_gst_percentage` per business.
- Sale stores historical line prices and computed `gstAmount`.

## 5. Sales

- Sales are **immutable** after creation (no delete in MVP).
- Payment types: `CASH`, `UPI`, `CARD`, `CREDIT`.

## 6. Expiry alerts (Krishi only)

- Alert window from `SystemConfig` key `expiry_alert_days` (default 30).
- Only `KRISHI` business type queries expiry alerts.

## 7. Audit (mandatory)

Append-only `AuditLog` for: `LOGIN`, `SALE_CREATE`, `STOCK_ADJUST`, `PRODUCT_CREATE`, `PRODUCT_UPDATE`, `PRODUCT_DELETE`, `BULK_UPLOAD`, `USER_CHANGE`, `CONFIG_UPDATE`.

## 8. System configuration (fully configurable)

All operational parameters are stored in `SystemConfig` and editable by **ADMIN** via Settings UI (`/settings`). No business logic hardcoded in application code.

| Key | Scope | Purpose |
|-----|-------|---------|
| `default_gst_percentage` | Business | Default GST for new products |
| `expiry_alert_days` | Business (Krishi) | Expiry dashboard window |
| `default_page_size` / `max_page_size` | Global | Pagination limits |
| `default_min_stock` | Business | Low-stock threshold default |
| `allowed_units` | Business | Inventory unit dropdown (JSON array) |
| `allowed_payment_types` | Business | POS payment options (JSON array) |
| `enable_bulk_upload` | Global | Bulk Excel feature flag |
| `enable_pos` | Business | POS checkout feature flag |
| `company_display_name` | Business | Invoice header override |
| `invoice_footer_text` | Business | Invoice PDF footer |

Env vars (`ENABLE_BULK_UPLOAD`, etc.) act as deployment-level overrides only.

## 9. Pagination

- Default page size: 25; maximum: 100 (from `SystemConfig` or env).

## 10. Bulk upload

- Max 100 rows per batch; per-row validation errors returned without partial commit of invalid rows in same batch (transaction per batch).
