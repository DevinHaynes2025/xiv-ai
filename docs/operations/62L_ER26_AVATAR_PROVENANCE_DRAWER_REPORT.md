# 62L-ER26 — Avatar Provenance Drawer Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest

Date: 2026-09-09  
Branch: `cursor/62l-er26-avatar-provenance-drawer-4059`  
Tip SHA: `266aec4ea87e71b8064a0a3710729fbdf348ea2a`  
Base: `cursor/62l-er22-historical-avatar-contract-4059` @ `1855355ad7a84adf33f3cd4fceb415991ee6012d` (best available progressive tip; preferred ER25→ER24→ER23 tips absent at implement time)  
Predecessor soft-wires: ER22 Historical Avatar Contract + report **PRESENT**; ER25 / ER24 / ER23 **WAITING_DATA** (ok; presence ≠ VERIFIED); ER2 / ER1 **PRESENT**; ER4 rights **WAITING_DATA**  
SoT: **GitHub #162** / **62L-ER** family — *62L-ER26 Avatar Provenance Drawer*  
Note: `gh issue view 162` may be unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Layer context (#162)

**62L-ER** — Real API Data Fabric + Global Historical Knowledge Ingestion + Offline/Online Brain Sync + Historical Avatar Simulations + Universal Device Distribution.

ER26 exposes an Avatar Provenance Drawer on every avatar response so users can tell what is documented, inferred, or generated — and clearly separate historical record from AI interpretation and actual person from AI representative.

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- Core experience: Avatar answer → “Why did it say this?” → Provenance Drawer
- Inspect: claim → source → evidence class → uncertainty
- Historical evidence labels: `DOCUMENTED` | `SCHOLARLY_INTERPRETATION` | `PLAUSIBLE_INFERENCE` | `DISPUTED` | `UNKNOWN`
- Living-person extras: `VOICE_AUTHORIZED` | `LIKENESS_AUTHORIZED` | `DELEGATION_SCOPE` | `CONSENT_EXPIRY`
- Revocation immediately reflects `REVOKED` / `LIMITED` / `SOURCE_REMOVED`; future generations stop using that material
- Private source text redacted without permission; internal citation refs may remain
- No deceptive identity, hidden provenance, fabricated sources, unauthorized voice/likeness, cross-tenant leakage, or hidden CoT
- Guardian/RLS/tenant/Universe unchanged
- DB candidates **NOT_APPLIED**; tip-land / PR: **NO**

## Drawer fields

`avatarId` · `avatarType` · `syntheticDisclosure` · `sourceCorpusVersion` · `keySourcesUsed` · `sourceDates` · `rightsLicenseState` · `consentState` · `tenantUniverseScope` · `documentedFacts` · `inferredContent` · `disputedClaims` · `uncertaintyLevel` · `generationTimestamp` · `modelRuntimeUsed` · `reviewerState` · `revocationStatus`

## Soft-wire (presence ≠ VERIFIED; absent → WAITING_DATA not FAIL)

| Target | Soft-wire on ER26 tip (ER22 base) |
| --- | --- |
| ER25 Avatar Evidence Classification + report | **WAITING_DATA** |
| ER24 Living-Person Avatar Consent + report | **WAITING_DATA** |
| ER23 Deceased-Person Historical Avatar Boundary + report | **WAITING_DATA** |
| ER22 Historical Avatar Contract + report | **PRESENT** (base) |
| ER4 Rights Provenance Gate + report | **WAITING_DATA** |
| ER2 API Truth State Machine + report | **PRESENT** |
| ER1 Real API Connection Registry + report | **PRESENT** |
| EQ16 / EQ15 / EQ13 / EQ12 / EP15 / EM (#157) | probe (typically PRESENT on ER2 lineage) |
| EQ14 Neural Pathway Architecture Graph | typically **WAITING_DATA** |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `avatar-provenance-drawer-types.ts` | fields, evidence labels, living extras, UX axes, locks, soft-wire |
| `avatar-provenance-drawer-runtime.ts` | build / inspect / revoke / redact / deny + cycle |
| `avatar-provenance-drawer.ts` | public facade |
| `phase62ler26.test.ts` | denial + honesty tests (~7) |
| `docs/operations/62L_ER26_AVATAR_PROVENANCE_DRAWER_REPORT.md` | this report |

## Autonomy / boundary denies (tested)

| Deny | Result |
| --- | --- |
| Fabricated sources | → **DENIED** |
| Hidden provenance | → **DENIED** |
| Deceptive identity (actual person vs AI representative) | → **DENIED** |
| Unauthorized voice / likeness | → **DENIED** |
| Expose private source without permission | → **DENIED** / redacted |
| Cross-tenant leak | → **DENIED** |
| Continue using revoked material | → **DENIED** |
| Hidden chain-of-thought / bypass Guardian/RLS / auto-deploy | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62ler26
```

| Command | Result |
| --- | --- |
| `npm run test:62ler26` | **PASS** — 7/7; record vs interpretation; person vs AI representative; revoke blocks future use; ER25/ER24/ER23 WAITING_DATA; ER22 PRESENT |

## Next (report only — do not implement)

**ER27 — Speculative / Extraterrestrial Research Layer** — organize astronomy, astrobiology, SETI, unusual-phenomena claims, cultural beliefs, and speculative technology while keeping established science clearly separated from unsupported claims.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- ManagePullRequest / draft PR: **NO** (park-and-implement; child branch only)
