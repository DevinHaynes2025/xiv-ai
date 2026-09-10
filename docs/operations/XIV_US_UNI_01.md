# US-UNI-01 — Universe Login Gate (execution notes)

## Goal
Executive can enter a private Universe and only see that org’s data.

## Current DB evidence (hosted Supabase)
- `xiv_organizations` / `xiv_universes` / memberships exist with RLS
- Isolation tests already pass in `npm run test:runtime` (Phase 2H)

## Acceptance checklist
1. [ ] Mobile lists Universes for memberships only
2. [ ] Selecting a Universe sets session context (org_id + universe_id)
3. [ ] Cross-universe reads denied (RLS + client)
4. [ ] Evidence row in XIV_TEST_EVIDENCE.md

## Next code slice
Audit `apps/mobile` auth/onboarding routes; wire Universe picker to `xiv_universe_memberships`.
