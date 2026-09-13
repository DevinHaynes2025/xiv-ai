# XIV Agent Alignment Briefing — the page every XIV agent is on (2026-09-13)

Single source of truth for every agent working on XIV AI OS (Claude Code lineage,
chatgpt/* implementer branches, grok/* branches, and any future taskforce member). If an
agent cannot state these facts, it is not on the page — raise it, do not guess.

## 1. Current lineage state (exact heads)

- Private GitLab: `gitlab.com/xiv-ai-group/xiv-ai-project.git`
- Integration branch `claude/12d-99-supervised-local-worker` @ `84886325`
  (12D-99 → 12D-103 queue lineage + 12D-104..108 + integrated 12D-109/110/111).
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

## 3. Shared invariants (12D-113 audits these mechanically)

- Every `*_GUARDRAILS` object is `Object.freeze`d and carries `humanDecision: 'REQUIRED'`.
- No governance module makes network calls. Fail closed on ambiguity; an unavailable
  gate is a blocker, never permission to route around it.
- Scale honesty: 2,000,000 rows is the queue's proven policy ceiling (synthetic fixture
  + operational drill). Sparse logical spaces (trillions of avatars/pathways/devices)
  are architecture, not existence. `billionUsersProven: false` until measured
  partition/shard/tenant-routing/regional-cell/failover evidence exists.
- The capability ladder never collapses: TARGETED ≠ ENROLLED ≠ VERIFIED ≠
  OBSERVED_LOCAL_WORKER; consent records are not clone authorization; pathway
  candidates are not activated pathways.

## 4. The scale ladder (agreed order of attack)

Local SQLite pilot (done, measured) → partition/shard contract (12D-109, done) →
tenant routing → regional service cells → distributed event + storage plane →
measured failover → measured horizontal scaling → only then billion-user readiness
claims.

## 5. Story board (what exists, what is next)

Built and green locally: 12D-85..106 (brain/queue/worker/recovery/review/renewal/social/
mode/reports), 12D-107/108 (control tower, device receipts), 12D-109/110/111
(partition contract, storage feed, taskforce roster expansion). In flight (this
round): 12D-112 external tool registry (Expo/Lovable/AMD/ChatGPT/Grok channels,
NOT_STARTED stage model), 12D-113 alignment invariant suite, 12D-114 Expo control-tower
frontend screen, 12D-115 loopback-only control-tower API surface, 12D-116 agent
training gate.

## 6. Roles

- Claude Code (this session): reviewer/builder on `claude/*` branches, worktree
  `xiv-build-12d-99`. Reviews implementer MRs before anything counts as validated.
- ChatGPT implementer: builds on `chatgpt/*` branches, opens MRs.
- Grok: PENDING since inception — no fabricated reviews.
- Humans (CEO): the only source of approval for merge, deploy, cloud, secrets,
  learning promotion, autopilot authorization. No agent self-approves.

Keep this briefing updated at each integration; cite exact heads when you report.