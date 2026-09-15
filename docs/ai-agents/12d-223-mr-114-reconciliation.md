# 12D-223 — Draft MR !114 Surface Reconciliation

Status: FINDINGS COMPLETE; CORRECTION PREPARED AND **NOT APPLIED**; nothing
pushed; MR !114 untouched. Per the CEO directive, this document and the full
inventory in `12d-223-release-ledger.md` are shown for reconciliation BEFORE any
push or MR update. `humanDecision: 'REQUIRED'`.

MR facts (CEO-verified on GitLab, re-verified locally): head
`faf39f087c8820acf3ffdb1e57888af038bd7d67`, parent
`f1e2546b64f8421f6fb224decc39ebf54b982da4`, delta +1,305/−12, review surface
268 files, exact-head pipeline 2848425397 with both jobs never started
(`ci_quota_exceeded`), draft, unapproved.

## Findings

| # | Finding | Severity | Evidence | Disposition |
|---|---|---|---|---|
| F1 | Stale MR title/description: describe only "worker lineage 12D-99→102 @ `303896c1`" while the MR spans 12D-99→12D-222 @ `faf39f08…`, 71 commits, 268 files | HIGH (reviewer-trust) | briefing rev 24 MR entry; GitLab MR state | PREPARED correction below; apply only on CEO authorization |
| F2 | Target-branch identity: MR is NOT against `gitlab/main` (main diff = 1824 files); merge base is `3f5e7fdc…` producing EXACTLY the 268-file surface | HIGH (lineage) | local `git diff` vs both bases; 4 candidate `chatgpt/*` branches share the base | Disclosed; exact branch name = OPERATOR-VERIFICATION item (no token/glab CLI in runtime) |
| F3 | Duplicate story identifiers via supersession: `12D-132`→`12D-221` (CEO renumber; 12D-132 belongs to MR !59); `12D-133` bridge→`12D-134` then 12D-133 REUSED for the release-lineage ledger | MEDIUM (needs ledger annotation, no re-work) | `9c5465e8`+`8ba82881`; `a0e8e316`+`03b65576`+`150cc659`; the renumber commits deleted the old-numbered handoff docs — final tree carries only new-numbered docs | Record supersession in the ledger; no file changes needed — the tree is already clean |
| F4 | Bundled ids: `12D-105` rides commit `143266c3` (subject-led `12D-104`); `12D-122` rides `9e50d230` (subject-led `12D-121`) | LOW (inventory hygiene) | commit subjects | Disclosed in ledger; future policy: one story id per commit subject |
| F5 | Unattributed commits: 12 of 71 commits carry no `12D-` id in the subject (reviews, 2M benchmark evidence, pathway/device bridge, mobile screen, CI fix, briefing, brain-control verification) | LOW (hygiene) | Appendix A of the ledger | Disclosed; classified by content, not re-staged |
| F6 | Missing handoff docs for in-surface stories: `12D-117`, `12D-122`, `12D-127`, `12D-128` | LOW (documentation debt) | `docs/ai-agents/` glob | Record as validation debt; do not backfill silently in this slice |
| F7 | Native CI never executed on ANY story in the MR (pipeline 2848425397: both jobs no-runner, `ci_quota_exceeded`) | BLOCKER for approval (org infra, not code) | CEO verification on GitLab | Cannot be fixed from this runtime; operator must restore runner capacity; no CI-passed claim permitted |
| F8 | Approvals outstanding: GROK_XAI (never responded — not fabricated), CTO, CEO; MR draft and unapproved | BLOCKER for merge | roles charter | Standing gates; no agent self-approves |
| F9 | Project-wide never-assigned ids: 12D-20, 21, 22, 23, 32, 42, 60, 72 (0 commits, 0 briefing mentions) | INFO | full 574-commit main-line census | Recorded as permanently unassigned |
| F10 | MR surface vs main-line discrepancy explained: 268 (target base `3f5e7fdc…`) vs 1824 (`gitlab/main` `1d61b787…`) — both numbers correct, different bases; also the history-union (270 paths) vs final surface (268) delta explained by the two renumber commits' doc deletions | INFO (was an open question) | local diffs + set-difference, both directions clean otherwise | Closed by Sections 1 and 3 of the ledger |

Out-of-scope changes in the MR surface: **none detected**. Every surfaced file
maps to a ledger story or to a review/evidence/briefing commit;
`services/ai/.xiv-runtime/` and `services/ai/provision-12d-99.ts` remain
untracked and outside the MR.

## PREPARED MR !114 correction (title + description) — NOT APPLIED

To apply ONLY on explicit CEO authorization, and only after the operator
confirms the target branch (F2) if desired. Prepared verbatim:

**Title:**
```
XIV AI worker lineage: 12D-99 supervised local worker → 12D-222 instruction adoption gate (71 commits, 268 files)
```

**Description:**
```markdown
## Scope

Cumulative worker-lineage MR spanning stories 12D-96/97 (reconciliation),
12D-99 through 12D-136, and 12D-221/12D-222 — from `9bb73b5e`
(12D-99 supervised end-to-end local worker) through `faf39f08`
(12D-222 instruction-side adoption & lineage reconciliation gate).
71 commits, 268 changed files. Supersession chains are disclosed in
docs/ai-agents/12d-223-release-ledger.md (12D-132→12D-221; the 12D-133/134
renumber chain; bundled ids 12D-105/12D-122).

## Verification status — HONEST

- LOCAL (diagnostic only, never CI facts): per-story suites green at their
  commits; final checkpoint totals at `faf39f08`: 125/125 focused+sibling
  tests, typecheck exit 0. Evidence: each story's handoff doc under
  docs/ai-agents/ plus xiv-agent-alignment-briefing.md rev 24.
- NATIVE CI: NOT EXECUTED. Pipeline 2848425397 at the exact head —
  `ai-service-typecheck` and `offline-brain-contracts`: no runner, never
  started, `ci_quota_exceeded` (org infrastructure). No CI-passed claim is
  made or implied anywhere in this MR.
- Review: CLAUDE_CODE self-review per story with adversarial findings paid
  down via regression tests (counts per story in the release ledger).
  GROK_XAI PENDING (never responded). MR remains DRAFT and UNAPPROVED.

## Outstanding gates (authorization belongs to humans only)

1. Operator: restore GitLab runner capacity (ci_quota_exceeded), then native
   exact-head CI must execute on this head.
2. Operator: confirm the target branch (merge base `3f5e7fdc…` produces the
   exact 268-file surface; exact branch name unverified in build runtime).
3. Independent review → CTO approval → CEO approval.
4. Issues #98 (CHANGES_REQUIRED) and #99 (diagnostic-only) remain in their
   recorded states; this MR modifies neither.

This MR executes nothing, moves no traffic, provisions no cells, and
materializes no production change. Flags throughout:
trafficMoved=false, providerCalls=0, modelCalls=0, remoteCalls=0,
productionMutationAllowed=false, humanDecision=REQUIRED.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

## Cumulative vs decomposed — RECOMMENDATION

**Recommendation: keep MR !114 cumulative, with a documented per-story ledger**
(`12d-223-release-ledger.md`) — do NOT decompose by rebasing or cherry-picking.

Rationale:
1. The per-story local evidence already exists, is SHA-anchored, and is
   cross-referenced by the new ledger — decomposition would rewrite history
   (rebases/cherry-picks are prohibited by the directive and would invalidate
   the CEO-verified head/parent and pipeline 2848425397).
2. The stories form a single dependency spine (queue → leases → recovery →
   contracts → adoption gates); splitting them creates 30+ review surfaces that
   re-derive the same context, while the 268-file surface is dominated by two
   stories (12D-117: 140 files; the runtime contract stories).
3. Consolidation priority (briefing rev 24) is: restore runner capacity →
   validate ONE canonical exact-head lineage → independent review → CTO → CEO.
   Decomposition conflicts with "no new parallel branches … during
   consolidation."
4. Risk of decomposition: renumber/supersession commits (F3) and NONE commits
   (F5) do not decompose cleanly; forced splits would manufacture exactly the
   duplicate-id problems this slice found.

If the CEO still prefers decomposition, it must be a separately authorized
future story with its own inventory — not a side effect of this slice.

## Preservation and non-actions (12D-223 objectives 7–9)

- Issue #98 remains **CHANGES_REQUIRED**; issue #99 remains **diagnostic-only**.
  Neither modified.
- NO rebase, cherry-pick, force-push, branch deletion, MR creation, MR update,
  CI retry, runner/billing change, merge, deploy, provider call, secret access,
  web ingestion, or Ollama invocation occurred or will occur in this slice.
- Flags (whole slice): `trafficMoved: false`, `providerCalls: 0`,
  `modelCalls: 0`, `remoteCalls: 0`, `productionMutationAllowed: false`,
  `mergeAuthorized: false`, `deploymentAuthorized: false`,
  `humanDecision: 'REQUIRED'`.

## Next steps (all require CEO authorization or operator action)

1. CEO reviews this document + the ledger (reconciliation checkpoint).
2. On authorization: commit the two 12D-223 docs, push to the `gitlab` remote
   (updates Draft MR !114's head; does not change its target).
3. On authorization: apply the prepared MR title/description (or the CEO
   applies it directly in GitLab — operator-side is equally valid).
4. Operator: GitLab API read to confirm the exact target branch (F2) and, in
   the separate 12D-133 ledger track, the real ~301-MR snapshot.
5. Operator: restore runner capacity so native exact-head CI can execute; only
   then may issue #98's CHANGES_REQUIRED state be revisited with CI facts.