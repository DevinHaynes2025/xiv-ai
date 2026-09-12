# Pathway evidence + device fleet integration — review handoff

Base: `38f1adfbd616b2a505d389d8eb9c29caa9540ec3` on the private supervised-worker lineage.

## Queue outcome → neural pathway candidate

`pathway-evidence-bridge.ts` binds a proposed neural-pathway candidate to an existing queue story only after the story is `DONE` and its stored output SHA-256 matches the supplied expected hash. It reuses `neural-pathway-growth-engine.ts` rather than creating a parallel pathway system.

The bridge NEVER grants human approval, NEVER activates the candidate, NEVER mutates model weights and NEVER writes production. The returned candidate remains `humanApproved:false`; `evaluatePathwayCandidate` therefore keeps it ineligible until the existing independent-review + human-approval + rollback requirements are satisfied. Queue `READY`, `LEASED`, `AWAITING_REVIEW`, cross-tenant and stale-hash cases fail closed.

This is a software neural-pathway workflow, not a claim of biological neurons or literal consciousness.

## Consent-bound device fleet enrollment

`device-fleet-enrollment.ts` reuses the existing `TARGET_MATRIX` from `universal-device-compatibility.ts`. Enrollment records tenant, user, device, requested surfaces, participation purposes, bounded expiry and consent evidence. Enrollment itself starts no worker, grants no production authority, authorizes no remote provider, and authorizes no biometric/identity clone.

A device whose matrix state is only `TARGETED` remains `UNVERIFIED_COMPATIBILITY`. Activation assessment can only return `ELIGIBLE_FOR_LOCAL_TASKS` after separate compatibility verification, unexpired/unrevoked consent, requested-surface support and runtime constraints. Background participation additionally checks explicit opt-in, battery and thermal state. The assessment makes zero remote calls and changes no OS/device setting.

Current matrix truth is preserved: Android ARM64 phones target a `LOCAL_AGENT` surface; iOS phones currently target WEB/PWA/REACT_NATIVE but do not claim `LOCAL_AGENT`. This story does not manufacture iOS local-agent support.

## Review commands

From `services/ai` in an isolated checkout:

```text
npm run typecheck:pathway-evidence-bridge
npm run test:pathway-evidence-bridge
npm run typecheck:device-fleet-enrollment
npm run test:device-fleet-enrollment
npm run typecheck
```

Also run inherited queue/pathway/device regressions relevant to changed imports. Report the exact head, native exit codes and any dissent.

## Trust limits

No worker launch, model request, platform OAuth, social-media API call, real user/device enrollment, cloud provisioning, live database migration, merge, deployment or learning promotion is authorized by this branch. Compatibility targets are not verified-device counts; logical pathways are not live agents; consent records are not identity-clone authorization.
