# 12D-104 — Governed Social-Media Ingestion Registry (handoff)

Status: BUILT LOCALLY on `claude/12d-99-supervised-local-worker`. Covers the CEO-directed scope: Meta, TikTok, X, LinkedIn, Instagram; historical account data.

## Honest state — read this first

- **No platform agreement, OAuth grant, or consent receipt exists today.** Every adapter starts at `NOT_STARTED`, `platformAccessEstablished` is hard-coded `false`, and nothing in this module contacts a platform or accepts credentials. There is NO social-media data flowing anywhere yet — by construction.
- **Stage advancement** (`advanceStage`) requires an evidence receipt, forbids regression, and **`LIVE` is unreachable from this module by design** — live ingestion requires a signed platform agreement plus verified user consent, which is an operator/human decision for a separate audited layer.
- **The only working ingestion path today is a user-supplied archive export** of the user's own account history (e.g. a platform "download your data" export): consent-attested, operator-attested, ORDINARY-only, local-only, bounded (10k/batch, 100k/account, 2k chars/text), deduplicated by content hash, isolated per tenant+platform+account.

## Surfaces

`listSocialAdapters` / `getSocialAdapter` / `advanceStage` / `ingestAccountArchive` / `pageArchive` / `archiveSummary` / `socialIngestionSnapshot`. Policy and guardrails are frozen objects (`SOCIAL_INGESTION_POLICY`, `SOCIAL_INGESTION_GUARDRAILS`: zero remote calls, no credentials stored, archive ≠ live access).

## Verification

7/7 tests (`test:12d-104`): NOT_STARTED posture and honest snapshot flags; stage advancement receipt/regression/LIVE-unreachable rules; consent+attestation+ORDINARY gates; entry validation and batch dedup; cross-batch dedup and bounded paging; tenant/account isolation; frozen guardrails. `typecheck:12d-104` PASS. Wired into `.gitlab-ci.yml` (remote execution still blocked by the org's `ci_quota_exceeded` — quota, not code).

## Trust limits

Zero model calls, zero remote calls, zero real user data. The registry proves the GOVERNANCE SURFACE for social ingestion, not platform access. Any future claim of "social media data available" must arrive with platform agreement receipts, a verified consent flow, and an operator decision — never from this module's stage flags.