# 12D-365 — Verified Data Sources screen (premium frontend rung)

**Story rung:** 12D-365 (frontend rung — CEO-directed premium
experience + data extraction direction) · **Parents:** 12D-364 ·
**Policy footprint:** none added

## What this rung is

A frontend screen that renders the reading campaign's honest license
state in the app — `WorkspaceVerifiedSources`
(`apps/mobile/src/screens/workspace/index.tsx`), its page
(`apps/mobile/src/app/business/verified-sources.tsx`), and the route
registered in `src/app/business/_layout.tsx`'s hidden list.

The screen carries the verified facts from the rungs that measured
them (12D-358/359/360/361/362/363):

- **World Bank Open Data** — CC BY 4.0 for World Bank-produced
  datasets (verified from the publisher's licensing page); ODbL and
  Microdata Research License for non-default datasets; per-dataset
  terms for third-party data; attribution carried.
- **data.gov** — federal data free and without restriction (17 U.S.C.
  § 105 posture); non-federal datasets carry per-dataset Access & Use
  terms; the catalog count is displayed, not ingested.
- **CFPB Consumer Complaint Database** — publisher grant quoted
  verbatim; API contract honestly unverified (JS/Swagger-only); no
  bulk download beyond the measured ceiling.
- **Measured ceiling** — 2,000,000 rows/database is the ONLY measured
  ceiling; trillion/billion/infinite scale is VISION, never product
  truth.
- The verify-then-read discipline is pinned: license → interface
  contract → measured rungs → CEO-gated review; loopback only,
  remoteCalls 0; secrets never render and never reach any model.

## Measured

- apps/mobile `npx tsc --noEmit` clean.

## Next candidates

1. Landing: 12D-355 → 356 → 357 → 358 → 359 → 360 → 361 → 362 (8
   prepared commits) + 12D-364 (landed 07a387d5) + this rung.
2. 12D-340 apply execution — CEO-approved; classifier-gate-blocked.
3. Approval rungs for the 12D-360/361/362/363 drafts (CEO-gated;
   2026-09-18b + 2026-09-19 "i approve" recorded as blanket).