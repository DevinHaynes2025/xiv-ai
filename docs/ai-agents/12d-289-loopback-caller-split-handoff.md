# 12D-289 — READING LOOPBACK CALLER SPLIT (12d-113 audit-debt paydown) (handoff)

Status: COMMITTED with the commit carrying this file on
`claude/12d-99-supervised-local-worker` (new `xiv-reading-loopback-caller`
module + the 12D-284 CLI split + the audit's AUTHORIZED_NETWORK_SURFACES
entry + 5-test adversarial suite). **TEST RUN DISCLOSED**:
`test:12d-289` = **5/5 pass**; `test:12d-113` (the alignment-invariant
audit suite) = **9/9 pass — the pre-existing debt is PAID, not
grandfathered**; `test:12d-284` (the CLI suite, whose module was split)
= **5/5**; `typecheck:12d-289` = **exit 0**. Chain regression
(12d-270…289 suites) = **187/187 across 20 suites, zero failures**.
Shell build: exit 0 (for the record; the shell tree is unchanged by
this rung). **CI IS NOT CLAIMED PASSED** (`ci_quota_exceeded`).
Reviewers: CLAUDE_CODE (self-review). GROK_XAI review PENDING — never
fabricated.

## What this rung is

The 12D-288 handoff's disclosed pre-existing debt: the 12d-113
alignment-invariant audit found the COMMITTED 12D-284 CLI module
(`xiv-supervised-reading-cycle.cli.ts`) declaring `*_GUARDRAILS` AND
carrying the loopback `fetch` — the audit's `guardrails-no-network`
invariant (debt cannot grandfather a network call into a guardrails
module) plus `network-surface-authorized` (the CLI was absent from
AUTHORIZED_NETWORK_SURFACES). Paid down by the same discipline as the
12D-286 receipt split:

1. **`xiv-reading-loopback-caller.ts`** (new): the reading chain's
   loopback caller lives in its own module — it declares NO
   *_GUARDRAILS (a network-USING module may not declare them), IS
   explicitly listed in the audit's AUTHORIZED_NETWORK_SURFACES, and
   carries its OWN local-plane binding (the pinned
   `127.0.0.1:11434` literal in its source). The model name is PINNED
   (qwen2.5-coder:7b, stream:false, temperature:0) and the endpoint is
   MECHANICALLY loopback-only: `buildLoopbackCallerForEndpoint`
   refuses any non-loopback host BEFORE any request, and refuses an
   out-of-range port (the suite caught `127.0.0.1:99999` passing the
   first regex — paid down with an explicit port check).
2. **The 12D-284 CLI split**: `buildLoopbackCaller` moved out; the CLI
   re-exports it for import stability (the CLI test's imports are
   unchanged); the CLI guardrails module now carries NO network
   primitive (asserted in-source by the suite).
3. **The audit**: `AUTHORIZED_NETWORK_SURFACES` gains the
   disclosed entry for the new module. The REAL audit over the
   offline-team runtime now reports **ZERO findings** (asserted by
   both the 12d-113 suite and this rung's suite).

## MEASURED LIVE (scratch `.xiv-runtime/`, never committed)

**The FIRST READING of a CEO-named source** (the 12D-287/288 handoffs'
top candidate), through the REAL contracts against the REAL local
Ollama (qwen2.5-coder:7b, loopback 127.0.0.1:11434, `remoteCalls: 0`):

- **22 CEO-named sources REGISTERED** through the REAL 12D-276
  contract (GSA github org; NIST detection_limits repo + hosted site;
  arXiv 2403.12029 ALDI; caltech-fish-counting CFC-DAOD; DOI
  10.18434/M32183; BTS y5ut-ibwt; CFPB prepaid search-agreements; JPL
  SBDB; Austin Socrata 3ebq-e9iz / 24mx-z6v2 / g5k8-8sud; Texas
  Socrata mwzi-gyw7 / hcbr-9ms7 / 54pj-3dxy / gmd3-bnrd; SBA
  certifications search + advocacy; NSF NCSES ABS-2023 + nsf22329;
  archives.gov; NYC SBS Eventbrite) — register now **48 entries**,
  `sourcesRead` was 0 (registered ≠ read). Licenses verified where
  confirmed by public pages (arXiv CC BY 4.0; usnistgov NIST-Software
  public domain), disclosed unverified elsewhere. Sources:
  arxiv.org/abs/2403.12029, github.com/usnistgov/detection_limits,
  pages.nist.gov/detection_limits/web/index.html,
  consumerfinance.gov/data-research/prepaid-accounts/search-agreements/.
- **THE FIRST READING**: `arxiv-aldi-2403-12029` ("Align and Distill:
  Unifying and Improving Domain Adaptive Object Detection" — ALDI,
  CFC-DAOD), the operator's own local capture of the public abstract
  page (CC BY 4.0, cited) read by the REAL model — chunk-1
  AWAITING_REVIEW, `draftChars 1119`, `modelCalls 1`, `remoteCalls 0`,
  stopped before review. **`sourcesRead` is now 1.**
- **THE RECEIPT**: the REAL 12D-285 receipt from the captured draft is
  QUEUE-VERIFIED (`readyForReview: true`); the shell submission was
  written for the operator (loopback only, never uploaded).
- One honest refusal was measured on the way (the scratch fixture
  passed an array where a string was required — the cycle refused
  `bodyText must be a non-empty string`, modelCalls 0) — the fixture
  was fixed, no contract change.

## Exact files

- `services/ai/runtime/offline-team/xiv-reading-loopback-caller.ts`
  (new)
- `services/ai/runtime/offline-team/xiv-reading-loopback-caller.test.ts`
  (new, 5 tests)
- `services/ai/runtime/offline-team/xiv-supervised-reading-cycle.cli.ts`
  (caller moved out; re-export for stability)
- `services/ai/runtime/offline-team/alignment-invariant-audit.ts`
  (AUTHORIZED_NETWORK_SURFACES entry)
- `services/ai/package.json` — `test:12d-289`, `typecheck:12d-289`
- `.gitlab-ci.yml` — `typecheck:12d-289`, `test:12d-289` steps
- `docs/ai-agents/12d-289-loopback-caller-split-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-289          # RAN: 5/5 pass
npm run test:12d-113          # RAN: 9/9 (debt PAID)
npm run test:12d-284          # RAN: 5/5
npm run typecheck:12d-289     # RAN: exit 0
chain regression 270..289     # RAN: 187/187 (20 suites)
shell npm run build           # RAN: exit 0
22 CEO-source registrations   # RAN: register 48 entries
first CEO-source reading      # RAN: measured (see above)
```

## Defects found and paid down during this story

- (suite-caught) `127.0.0.1:99999` passed the endpoint regex — a
  5-digit port past 65535. Paid down with an explicit port-range check
  (its own honest refusal message, asserted by the suite).
- (test-caught) The fixture read `seen.length` instead of the server's
  captured-bodies array — test bug, fixed before commit.
- (disclosed, NOT this rung's debt) `test:12d-134` / `test:12d-222`
  still fail on the 12D-233 custody-registry fixture requirement in
  `scaling-execution-bridge.ts`; the 12d-85…91 "suites" are not
  node:test suites. Unrelated chains.

## Approval status

The live reading used the CEO-approved Ollama first-reader rung
(modelCalls counted: 1), `remoteCalls: 0` (loopback), no provisioning,
no merge, no deployment, no learning promotion, no activation, no
credential use. WebFetch of the public arXiv page + two public-web
searches are covered by the 2026-09-15 free-public-resources
authorization (cited above). The commit stages ONLY the files above
and never touches `services/ai/.xiv-runtime/` or
`services/ai/provision-12d-99.ts`.

## Next candidates

- Review decisions on the FOUR settled drafts (GHG chunk-1/2/3 + the
  ALDI chunk-1, all AWAITING_REVIEW) — the human decision is Devin's.
- Read further CEO-named sources through the cycle (BTS, CFPB,
  Austin/Texas Socrata, NSF NCSES are registered; the Socrata IDs'
  dataset subjects should be verified before reading).
- The 12D-233 custody-registry fixture debt in the 134/222 chains —
  its own rung.
- Adopt the 12D-278 bound bridge as the ONLY admission door — CEO
  decision.
- The 12D-243/12D-245 operator questions (fail-closed,
  CEO-decision-gated); rail integration for 12D-266 (BLOCKED on CEO
  authorization + credentials); GitHub Phase 1 lockdown (blocked on
  `! gh auth login`).