# Technical Specification: Multi-Business Unified Shop Management System (Gohite)

## Executive Summary
A unified platform managing two distinct business segments:
1. **Gohite Krishi Seva Kendra** (Agricultural inputs)
2. **Gohite Hardware Hub** (Industrial & plumbing tools)

## Core Features
- **Multi-Tenant Context:** Dynamic switching between Krishi and Hardware layouts.
- **Polymorphic Inventory:** Custom fields (Expiry/Batch for Krishi; Size/Material for Hardware).
- **POS Billing:** Unified transaction register with multi-tax support.
- **Bulk Operations:** Excel/Spreadsheet uploads for inventory management.
- **Reports:** Automated PDF/Excel document generation.

## Technical Stack
- **Frontend:** React.js, Tailwind CSS.
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL.
- **Auth:** JWT with business-scoped permissions.
