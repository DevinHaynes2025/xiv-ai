# US-UNI-01 — Universe Login Gate (execution notes)

## Goal
Executive can enter a private Universe and only see that org's data.

## Audit result (2026-09-09) — largely IMPLEMENTED
Mobile already ships:
- `apps/mobile/src/context/tenant.tsx` — TenantProvider with selectOrganization / selectUniverse
- `apps/mobile/src/lib/tenant.ts` — Supabase hydration from xiv_* tables
- `apps/mobile/src/components/tenant/tenant-desk.tsx` — UI for org/Universe pick + create
- Routes: `executive/universes`, `business/universes` (+ universe-fabric)

Hosted DB:
- Isolation Org A/B Universes active (internal/business) with RLS
- Runtime tests Phase 2H already prove cross-org denial

## Acceptance
1. [x] Mobile lists Universes for memberships (TenantDesk)
2. [x] Selecting a Universe sets active tenant context
3. [x] Cross-universe reads denied via RLS (test:runtime evidence)
4. [ ] Device e2e smoke on founder account (manual)
5. [ ] Founder memberships beyond isolation fixtures (product data)

## Drive sync
Brain sync doc created in Google Drive after connector auth.
