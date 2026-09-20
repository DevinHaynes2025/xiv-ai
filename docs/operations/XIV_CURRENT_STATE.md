# XIV Current State

This file records only evidence-backed engineering state.

## Repository
- Canonical development branch: `xiv-v2`
- Feature work: child branches/worktrees only
- Main push: prohibited for agent work
- Force push: prohibited

## Runtime truth
Use only:
- UNKNOWN
- NOT_CONFIGURED
- DETECTED
- SUPPORTED
- VERIFIED
- NOT_TESTED
- DEGRADED
- STALE
- WAITING_DATA
- WAITING_PROVIDER
- OFFLINE_STOPPED
- UNAVAILABLE
- REVOKED

## Current priorities
1. Reconcile local/GitHub/GitLab SHAs before promotion.
2. Prove local Ollama worker with heartbeat + bounded task receipt.
3. Validate AI service tests and mobile type/lint/bundle state.
4. Verify CPU first; GPU/NPU only with real runtime evidence.
5. Build shared agent context/handoff before expanding agent count.
6. Profile only authorized data sources with provenance and tenant/Universe scope.

## Safety
Guardian/RLS/tenant/Universe isolation remain mandatory.
No production deploys, production DB mutations, permission expansion, autonomous purchases, or secret collection.

`L4_AUTONOMY_ENABLED=false`.
