# XIV Agent Alignment Briefing — the page every XIV agent is on (2026-09-13, rev 7)

Single source of truth for every agent working on XIV AI OS (Claude Code lineage,
chatgpt/* implementer branches, grok/* branches, and any future taskforce member). If an
agent cannot state these facts, it is not on the page — raise it, do not guess.

## 1. Current lineage state (exact heads)

- Private GitLab: `gitlab.com/xiv-ai-group/xiv-ai-project.git`
- Integration branch `claude/12d-99-supervised-local-worker` @ `13c9b528`
  (12D-99 → 12D-103 queue lineage + 12D-104..108 + 12D-109/110/111 + 12D-112 through
  12D-118 fully integrated; 12D-115's blocking review finding fixed at integration;
  12D-113 rebuilt directly after its workflow agent stalled 6×; 12D-117 paid down the
  entire guardrails debt ledger; 12D-118 mapped the L0–L5 authority ladder onto all
  100 workforce roles; the parallel 12D-97 consent-assessment lineage (MR !18) is
  RECONCILED onto the queue lineage (MR !17) — eligibility is never admission;
  a stray `<<<<<<< HEAD` conflict marker the reconciliation cherry-pick left in
  `.gitlab-ci.yml` is fixed (file now parses clean); 12D-119 built the tenant-routing
  ADOPTION layer — the reviewed adapter that makes 12D-109's advisory routing operative
  over caller-provisioned local shard queues, receipt-gated at adoption and at every
  onboarding, with the measured 2,000,000-row per-shard ceiling enforced).
- MR !114: worker lineage 12D-99→12D-102 @ `303896c1` (team review checkpoint).
- MR !117: `chatgpt/queue-summary-scale-index` @ `577c301e` — governed summary-index
  migration; Claude Code review verdict **SOUND** (10.15× at 2M rows, both blocking
  findings resolved). Not merged.
- MR !118: `chatgpt/pathway-evidence-device-fleet` @ `9a6c43ab` — pathway bridge +
  device fleet; Claude Code review verdict **SOUND**. Not merged.
- Remote CI: blocked by `ci_quota_exceeded` on every pipeline (runner = null) —
  org infrastructure, not code. Local batteries are green; do not claim CI-passed.

## 2. The constitution every packet carries

`humanDecision: 'REQUIRED'` · `learningPromoted: false` · `automaticRecovery: false` ·
`liveAgentCount: null` (never a fabricated number) · zero model calls in the offline
runtime unless a story explicitly authorizes the local Ollama bridge (loopback
127.0.0.1:11434 only; TOP_SECRET/CONFIDENTIAL never leaves the local plane) · zero real
user stories/tenants/devices behind any test or drill · reviewers CLAUDE_CODE /
GROK_XAI PENDING — Grok has never responded; never fabricate its review.

## 3. Shared invariants (12D-113 audits these mechanically — run `npm run test:12d-113`)

- Every `*_GUARDRAILS` object is `Object.freeze`d and carries `humanDecision: 'REQUIRED'`.
  12D-117 paid down the entire 136-object debt ledger (126 objects wrapped in
  `Object.freeze`, 10 frozen entries given the missing key), so the frozen GENERATED
  ledger `alignment-invariant-debt.ts` is now EMPTY. It stays **shrink-only**: any new
  violation fails the audit, and new unfrozen guardrails objects are new debt — fix them,
  never add ledger entries.
- No governance module makes network calls. Fail closed on ambiguity; an unavailable
  gate is a blocker, never permission to route around it. The ONLY authorized network
  surfaces are the loopback Ollama (127.0.0.1:11434) collaboration surfaces, the
  loopback token-gated control-tower HTTP server, and the local child_process reviewer —
  mechanically enforced by 12D-113's `AUTHORIZED_NETWORK_SURFACES`.
- Scale honesty: 2,000,000 rows is the queue's proven policy ceiling (synthetic fixture
  + operational drill). Sparse logical spaces (trillions of avatars/pathways/devices)
  are architecture, not existence. `billionUsersProven: false` until measured
  partition/shard/tenant-routing/regional-cell/failover evidence exists.
- The capability ladder never collapses: TARGETED ≠ ENROLLED ≠ VERIFIED ≠
  OBSERVED_LOCAL_WORKER; consent records are not clone authorization; pathway
  candidates are not activated pathways.
- Evidence packets served to any surface (including the loopback-only 12D-115 snapshot
  API) are exact-shape validated; an invented field (e.g. a fabricated
  `liveAgentCount`) is a 503, never a 200.
- The L0–L5 authority ladder (L0 Observe · L1 Recommend · L2 Draft · L3 Human Approval ·
  L4 reserved · L5 Human Only) is mapped onto all 100 enterprise workforce roles
  (`enterprise-authority-ladder.ts`); L4 is never assignable; L3/L5 domains are
  approval-gated or human-reserved; a mapped level is a ceiling on a role's output
  shape, never an activation.

## 4. The scale ladder (agreed order of attack)

Local SQLite pilot (done, measured) → partition/shard contract (12D-109, done) →
tenant routing → regional service cells → distributed event + storage plane →
measured failover → measured horizontal scaling → only then billion-user readiness
claims.

## 5. Story board (what exists, what is next)

Built and green locally: 12D-85..106 (brain/queue/worker/recovery/review/renewal/social/
mode/reports), 12D-107/108 (control tower, device receipts), 12D-109/110/111
(partition contract, storage feed, taskforce roster expansion), 12D-112 external tool
registry (Expo/Lovable/AMD/ChatGPT/Grok channels, NOT_STARTED stage model, LIVE
unreachable by construction), 12D-113 mechanical alignment-invariant audit + shrink-only
debt ledger (136 legacy violations ledgered), 12D-114 Expo control-tower screen
(governed, example-data-only), 12D-115 loopback-only control-tower snapshot API
(off by default, operator-receipt-gated, exact-shape validated), 12D-116 agent training
gate (proposals held, no outcome recording, runs never started), 12D-117 full guardrails
debt paydown (136/136 frozen + humanDecision; ledger empty; audit green), 12D-118
L0–L5 authority-ladder mapping over all 100 workforce roles (adversarially verified,
conservative refute-downs applied; L4 never assigned), 12D-97 reconciliation
(MR !18's device-participation consent assessment now rides the MR !17 queue lineage;
33/33 tests including the eligibility-never-admission integration proof), 12D-119
tenant-routing adoption (`tenant-routed-queue.ts`: receipt-gated adoption, no database
materialized by the facade, per-shard singleton leases unchanged, aggregate shard
ceiling enforced; 5/5 tests, typecheck green, adversarial review applied).

Queued next: nothing outstanding — the "120s queue-lease cap on long generations" item
was closed by verification, not by new code: `supervised-local-worker.ts` already
renews the host lease AND extends the queue lease on the same 4s maintenance interval
(`admission.renew(ticket)` + `admission.renewQueueLease(ticket,
SUPERVISED_WORKER_POLICY.queueRenewalExtendMs)`, extend = 60_000), bounded by 12D-102's
total-life cap, and the run packet honestly
reports `queueLeaseExtensions` / `queueLeaseExtensionExhausted`. No duplicate was built;
the item is resolved as already-implemented. Reviewer key custody stays an operator
concern. Next rung on the scale ladder after 12D-119: regional service cells (not
built; needs its own measured evidence).

## 6. Roles

- Claude Code (this session): reviewer/builder on `claude/*` branches, worktree
  `xiv-build-12d-99`. Reviews implementer MRs before anything counts as validated.
- ChatGPT implementer: builds on `chatgpt/*` branches, opens MRs.
- Grok: PENDING since inception — no fabricated reviews.
- Humans (CEO): the only source of approval for merge, deploy, cloud, secrets,
  learning promotion, autopilot authorization. No agent self-approves.

Keep this briefing updated at each integration; cite exact heads when you report.