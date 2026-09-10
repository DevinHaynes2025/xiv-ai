# Evidence note — mobile↔ai TS boundary (2026-09-09)

Applied via GitHub while ASUS desktop was offline.

Changes:
- `checkpoint.ts`: isomorphic fingerprint (no `node:crypto`)
- `tenant/index.ts`: dropped Node-only review re-exports (tests already import review modules directly)
- `apps/mobile/tsconfig.json`: durable excludes for Node-only AI modules

Local verification PENDING until XiV reconnects:
- `cd services/ai && npm run typecheck && npm run test:runtime`
- `cd apps/mobile && npx tsc --noEmit`
