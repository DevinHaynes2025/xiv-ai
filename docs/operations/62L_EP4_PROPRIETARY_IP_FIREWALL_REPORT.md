# 62L-EP4 — Proprietary-IP Firewall Report

Status: **IMPLEMENTATION COMPLETE ON CHILD BRANCH** — unit tests **executed** — denial tests **PASS** — **NOT** production authorization — **NO** tip-land / PR / ManagePullRequest / unknown-rights auto-accept / private→global corpus

Date: 2026-09-09  
Branch: `cursor/62l-ep4-proprietary-ip-firewall-4059`  
Tip SHA: _(filled after commit)_  
Base: `cursor/62l-ep2-cross-vendor-capability-graph-4059` @ `63d5f61f668f4f4c4ad2efeae6d396f95ba21833`  
Predecessor: EP2 Cross-Vendor Capability Graph **PRESENT**; EP3 **WAITING_DATA** (not landed; EP4 branched from EP2)  
SoT: **GitHub #160** / **62L-EP** family — *62L-EP4 Proprietary-IP Firewall*  
Note: `gh issue view 160` unresolved in this agent environment; issue number retained from founder SoT statement.  
GitLab mirror: **not resolved** (GitLab MCP `needsAuth`; **no issue number invented**)

## Honesty banner

`DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED`

- `L4_AUTONOMY_ENABLED=false`
- **UNKNOWN_RIGHTS → QUARANTINED** (not automatically accepted)
- Only clearly authorized categories can enter promoted XIV knowledge (after reviewer approval)
- Customer A private knowledge ≠ global training corpus
- Neural memory stores **claim + citation + provenance + rights state + confidence + context** — not copied proprietary repos or restricted corpora
- Revocation must identify dependents for removal/isolation
- Guardian/RLS/tenant/Universe isolation unchanged
- DB candidates **NOT_APPLIED**
- Tip-land / PR / ManagePullRequest / prod deploy: **NO**

## Core flow (encoded)

`Source → Rights Check → Classification → Allow / Quarantine / Deny → Research Use`

## Source rights states (12)

`PUBLIC_DOMAIN` | `OPEN_LICENSE` | `VENDOR_PUBLIC_DOCUMENTATION` | `PEER_REVIEWED` | `LICENSED` | `USER_AUTHORIZED` | `CUSTOMER_AUTHORIZED` | `PARTNER_AUTHORIZED` | `UNKNOWN_RIGHTS` | `RESTRICTED` | `LEAKED_OR_STOLEN` | `CONFIDENTIAL`

## Promotion workflow (encoded)

`Research Agent finds source → provenance scan → rights/license check → sensitivity classification → security review → knowledge candidate → reviewer approval → graph promotion`

## Soft-wire (presence ≠ VERIFIED)

| Target | Soft-wire on EP2 tip |
| --- | --- |
| EP2 Cross-Vendor Capability Graph + report | **PRESENT** |
| EP1 Virtual Chip Contract + report | **PRESENT** |
| EP3 Chip Research Agent Team | **WAITING_DATA** / absent |
| EM (#157) Agent Compute Home Base | probe (boolean) |

## Deliverables (`services/ai/local-brain/**`)

| File | Role |
| --- | --- |
| `proprietary-ip-firewall-types.ts` | rights states, workflow, locks, soft-wire |
| `proprietary-ip-firewall-runtime.ts` | classify/quarantine/promote/deny surfaces + cycle |
| `proprietary-ip-firewall.ts` | public facade |
| `phase62lep4.test.ts` | denial + honesty tests |
| `docs/operations/62L_EP4_PROPRIETARY_IP_FIREWALL_REPORT.md` | this report |

## Autonomy / IP denies (tested)

| Deny | Result |
| --- | --- |
| UNKNOWN_RIGHTS auto-accept | → **DENIED** (quarantine) |
| RESTRICTED / LEAKED / CONFIDENTIAL auto-promote | → **DENIED** |
| Blocked sensitivity materials | → **DENIED** |
| Promote without human review | → **DENIED** |
| Share private to global corpus | → **DENIED** |
| Paywall bypass / credential harvest / private scrape | → **DENIED** |
| Cross-tenant private share | → **DENIED** |
| Skip revocation dependent identification | → **DENIED** |
| L4 autonomy | `L4_AUTONOMY_ENABLED=false` |

## Tests

```bash
cd services/ai && npm run test:62lep4
```

| Command | Result |
| --- | --- |
| `npm run test:62lep4` | **PASS** — rights/quarantine; blocked materials; promotion gates; agent safeguards; EP2 present / EP3 WAITING_DATA |

## Next (report only — do not implement)

**EP5 — Public Benchmark Memory** — provenance-backed memory of lawful chip/runtime/model benchmarks; separate published benchmark evidence from XIV locally verified measurements.

## Tip-land / PR

- Tip-land onto `xiv-v2` / `main`: **NO**
- Pull request / ManagePullRequest: **NOT CREATED**
