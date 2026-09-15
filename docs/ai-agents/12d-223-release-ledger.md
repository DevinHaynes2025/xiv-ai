# 12D-223 — Release Ledger: Draft MR !114 Inventory (merge base → faf39f08)

Status: INVENTORY COMPLETE, NOT COMMITTED, NOT PUSHED. This ledger is a
documentation/inventory/validation-debt-control artifact produced under the CEO's
12D-223 directive. It adds NO runtime feature. Local transcripts were treated as
diagnostic evidence only — nothing local is reported as a native-CI fact.

Evidence basis (all measured locally from `git` on branch
`claude/12d-99-supervised-local-worker` at head `faf39f087c8820acf3ffdb1e57888af038bd7d67`,
plus `docs/ai-agents/xiv-agent-alignment-briefing.md` rev 24 and each story's handoff doc):

- MR !114 head: `faf39f087c8820acf3ffdb1e57888af038bd7d67`
  (parent `f1e2546b64f8421f6fb224decc39ebf54b982da4`) — verified locally AND by the CEO on GitLab.
- MR !114 review surface: **268 files** (CEO-verified on GitLab).
- Exact-head pipeline: **2848425397**; `ai-service-typecheck` and
  `offline-brain-contracts`: **no runner, never started, `ci_quota_exceeded`** —
  no remote test has EVER executed on this MR. No CI-passed claim exists or may exist.

## 1. Target-branch reconciliation (RESOLVED to a merge base; branch name pending operator)

`git diff --name-only 3f5e7fdc378b8ba707e2a868dd14c17ba7e08812..faf39f08…` returns
**exactly 268 files** — matching the GitLab review surface exactly. The MR's target
branch therefore forks from `3f5e7fdc378b8ba707e2a868dd14c17ba7e08812`
(`test(xiv): gate shared admission with SQLite persistence and four-process contention
tests`, parent `04631c679e7e584df12ec4e68a8d578ba8df464f`, 2026-09-12), which IS an
ancestor of the head. Local candidates sharing that merge base: `chatgpt/
12d-105-evidence-grounded-team-coach`, `chatgpt/12d-98-shared-host-queue-admission`,
`chatgpt/12d-99-confidential-local-only-routing`,
`chatgpt/authenticated-presence-host-admission-bridge`. The exact target branch name
requires an operator-side GitLab API read (no token or glab CLI exists in this
runtime) — an OPERATOR-VERIFICATION item, disclosed, never guessed.

- MR !114 is **NOT** targeted at `gitlab/main` (`1d61b787a476e830199c19022c72769e40b8ba66`):
  `git diff --name-only 1d61b787…faf39f08` = **1824 files ≠ 268**. This is why the
  MR surface and the main-line diff disagreed; both numbers are now explained.
- MR commit range: `3f5e7fdc..faf39f08` = **71 commits**, **40 distinct story ids**,
  **12 commits with no story id in the subject**, surface union **268 files**.
- The MR's first commit is `9bb73b5e08d9a535527704e4f223ce734718eb22`
  (`feat(xiv): 12D-99 supervised end-to-end local worker`) — the MR legitimately
  starts at 12D-99; 12D-98 and earlier stories live below the merge base.

## 2. Per-story ledger

Columns: commits (short SHAs, in order), changed-file count (union in the MR surface),
local evidence (LOCAL, diagnostic only), native CI (uniform), review status.
Native CI for EVERY row: **never executed — `ci_quota_exceeded`, pipeline 2848425397,
both jobs no-runner/never-started**. Merge/deploy authority for EVERY row:
**CEO only — `mergeAuthorized: false`, `deploymentAuthorized: false`,
`humanDecision: 'REQUIRED'`**. Flags for EVERY row: `trafficMoved: false`,
`providerCalls: 0`, `modelCalls: 0`, `remoteCalls: 0`,
`productionMutationAllowed: false`.

| Story | Title (commit subject) | Commits | Files | Local evidence | Native CI | Review |
|---|---|---|---|---|---|---|
| 12D-96 | enterprise workforce queue (pre-base follow-up) | `aa0c5444` | 1 | handoff doc + briefing rev 24 | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-97 | consented device participation reconciliation | `ac9d7868`,`41e1e696`,`c522187b` | 7 | 33/33 incl. eligibility-never-admission integration proof | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-99 | supervised end-to-end local worker | `9bb73b5e` | 7 | per 12d-99 handoff; battery green locally | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-100 | operator recovery for held leases and stale queue holds | `e3bd0fd3` | 8 | per handoff; 2M ceiling recorded | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-101 | authenticated review response ingestion | `14158944` | 6 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-102 | queue lease renewal + total-life cap | `303896c1` | 8 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-103 | operational 2M-row drill (measured queue ceiling) | `d1ade2ff` | 4 | 2,000,000 rows = ONLY measured ceiling | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-104 | governed social ingestion registry (+ **bundled 12D-105**) | `143266c3` | 8 | per handoffs 104/105 | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-106 | governed report composer | `38f1adfb` | 5 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-107 | control-tower evidence | `3fbc8fea` | 8 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-108 | device worker receipt | `5f9d1b82` | 3 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-109 | queue partition contract | `3be136bb` | 5 | per handoff + 109–111 drill evidence | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-110 | storage feed hierarchy | `1e60deca` | 5 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-111 | taskforce roster expansion | `84886325` | 5 | per handoff + drill evidence | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-112 | external tool registry (LIVE unreachable by construction) | `cf895d98`,`250fc262` | 6 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-113 | mechanical alignment-invariant audit (shrink-only ledger) | `d2dd94f3` | 6 | audit suite green (9/9 as re-run in 12D-222) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-114 | Expo control-tower screen (governed, example-data-only) | `9e9e1f2f` + NONE `965cc573` | 4 | mobile typecheck green | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-115 | loopback-only control-tower snapshot API | `10106586`,`89252cba` | 5 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-116 | agent training gate (proposals held, runs never started) | `9377acac` | 5 | per handoff | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-117 | guardrails debt paydown (136/136 frozen; ledger empty) | `463bcbe8`,`1388262d` | 140 | audit green; debt ledger EMPTY | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-118 | L0–L5 authority ladder over 100 roles | `1ab31f2f`,`8ce15f73` | 6 | adversarially verified, conservative refute-downs | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-119 | tenant-routing adoption | `d4320540` | 6 | 5/5 + typecheck | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-120 | regional-cell placement contract | `b819bfe2`,`38d8197f` | 7 | 7/7 + typecheck; 9 findings (3 BLOCKING paid) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-121 | decision-safety workflow (+ **bundled 12D-122**) | `9e50d230`,`dc7b0454` | 8 | 11/11; 7 findings (4 BLOCKING paid) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-123 | distributed event+storage plane contract | `52beacf1`,`109c74b3` | 6 | 6/6; 3 findings (1 BLOCKING paid) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-124 | story-engine backend contract | `7daebb44`,`69684ce9`,`80c97bc9` | 6 | 5/5 (+ head-fix re-run 5/5); 7 findings (4 BLOCKING paid) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-125 | business health score contract | `17b40308`,`a0f8c7a7` | 6 | 6/6; 6 findings (1 BLOCKING paid) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-126 | measured regional failover (review+paydown) | `fa7c2877`,`ce6e5b54` | 6 | 15/15; 4 defects (2 BLOCKING) live-reproduced; implementer's 26/26 claim UNVERIFIED | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-127 | failover decision loop | `501b8312`,`1b907a90` | 4 | 16/16 + typecheck | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-128 | planDigest-provenance residual closed | `f9e99f84`,`d859fb21` | 4 | 17/17 + typecheck | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-129 | measured horizontal scaling contract | `c6543764`,`cdec9266` | 9 | 11/11; 2 findings paid | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-130 | scaling EXECUTION-INSTRUCTION bridge | `4e024d09`,`c4ebf03d` | 9 | 9/9 + sibling 12/12 | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-131 | failover EXECUTION-INSTRUCTION bridge | `bf6426ea`,`ca533350` | 8 | 9/9 + sibling 17/17 | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-132 | declared-evidence collectors — **SUPERSEDED by 12D-221** | `9c5465e8` | 8 | 12/12 (as re-run under 221) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-133 | instruction-evidence bridge (renumbered 12D-134) + release-lineage ledger | `a0e8e316`,`150cc659` | 10 | 10/10 (as 134) + 11/11 (ledger) | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-134 | renumber commit for the instruction-evidence bridge | `03b65576` | 6 | 10/10 + typecheck | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-135 | event-plane adoption layer | `312b236a` | 6 | 6/6 + siblings + audit | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-136 | cell-placement adoption & event-plane binding | `f1e2546b` | 6 | 7/7 + siblings + audit | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-221 | declared-evidence collector (renumbered FROM 12D-132) | `8ba82881` | 12 | 12/12 + siblings + typecheck + audit | never executed | CLAUDE_CODE done / GROK_XAI pending |
| 12D-222 | instruction-side adoption & lineage reconciliation gate | `faf39f08` | 8 | 9/9 + 11 sibling suites + audit 9/9 + typecheck (125/125 total) | never executed | CEO 8-point risk list paid; GROK_XAI pending |
| (no id) | reviews, 2M benchmark/remediation, pathway bridge, device fleet, briefing, CI conflict-marker fix, brain-control verification, 12D-114 mobile screen | 12 commits (below) | 20 | per named docs (MR !117/!118 reviews SOUND; 2M benchmark recorded) | never executed | MR !117/!118 verdicts SOUND — separate MRs, NOT this MR |

Unattributed (NONE) commits in the surface, in order:
`5326fb5c` (2M capacity fixture + evidence), `ec0d94d2` (MR !117 independent review),
`56ba6ac5` (pathway evidence bridge), `ea07bfdd` (device fleet enrollment),
`9110739b` (wire pathway+device into validation), `2698317c` (MR !118 SOUND /
MR !117 remediation reviews), `19959de7` (MR !118 review), `9206832d` (MR !117
remediation benchmark), `a510b0a6` (2M drill evidence + briefing), `965cc573`
(12D-114 mobile screen), `13c9b528` (.gitlab-ci.yml conflict-marker fix +
briefing rev 6), `a6a74da8` (live brain-control verification, Windows host,
2026-09-14). Full 40-char SHAs and parents: Appendix A.

## 3. Detection findings (12D-223 objective 3)

1. **Duplicate story identifiers (real, explained by supersession — not re-work):**
   - `12D-132` (`9c5465e8`) → renumbered `12D-221` (`8ba82881`) by CEO directive
     because 12D-132 already belongs to Draft MR !59. Both commits are in the MR
     surface. The renumber commit also DELETED the old-numbered doc
     (`12d-132-declared-evidence-collector-handoff.md`): the final tree carries
     only `12d-221-declared-evidence-collector-handoff.md` — a clean supersession
     with no stale doc left behind. The old path exists only in commit history
     and accounts for part of the history-union vs final-surface delta (below).
   - `12D-133` carried the instruction-evidence bridge (`a0e8e316`), renumbered
     `12D-134` (`03b65576`) after the CEO reassigned 12D-133; `12D-133` was then
     REUSED for the release-lineage ledger (`150cc659`). The renumber commit
     likewise DELETED `12d-133-instruction-evidence-bridge-handoff.md`; the final
     tree carries `12d-134-instruction-evidence-bridge-handoff.md` and
     `12d-133-release-lineage-ledger-handoff.md` only. The renumber happened
     before any push, so no published lineage carries two stories under 12D-133 —
     but the MR surface contains the renumber chain and must disclose it.
2. **Bundled story ids (a commit subject carrying two ids):**
   `143266c3` = "12D-104 …; 12D-105 runtime mode governor";
   `9e50d230` = "12D-121 … + 12D-122 Story Engine screen". 12D-105 and 12D-122
   have no first-class commit; their id never leads a subject. Not a missing id —
   a **bundled-id** finding; future policy: one story id per commit subject.
3. **Story ids absent from the MR range:** 12D-98 (pre-merge-base by design),
   12D-105 and 12D-122 (bundled, above). No other assigned id is missing from
   12D-99..136 ∪ {221, 222}. Project-wide never-assigned ids (from the full
   574-commit main-line census, merge base `1d61b787`): 12D-20, 21, 22, 23, 32,
   42, 60, 72 — zero commits, zero briefing mentions; recorded as permanently
   unassigned, not lost.
4. **Stale MR description (confirmed):** the MR title/description still describe
   only "worker lineage 12D-99→102 @ `303896c1` (team review checkpoint)" while
   the MR now spans 12D-99→12D-222 @ `faf39f08…` — 71 commits, 268 files.
   Correction PREPARED, NOT APPLIED (see 12d-223-mr-114-reconciliation.md).
5. **Commits lacking handoff documentation (in MR surface):** `12D-117`,
   `12D-122`, `12D-127`, `12D-128` have no dedicated `docs/ai-agents/12d-*-handoff`
   file; their evidence lives only in the briefing and/or the sibling handoffs.
   Also the 12 NONE commits are review/evidence commits, which do not require
   handoffs but ARE unattributed in subject-line terms.
6. **Unvalidated lineage:** the target branch name (Section 1) is the one lineage
   fact this runtime cannot close without an operator GitLab API read. Everything
   else is SHA-verified locally and CEO-verified on GitLab.
7. **Out-of-scope changes:** NONE detected. Every surfaced file maps to a story
   above (runtime code + its handoff + its CI/package wiring) or to a review/
   evidence/briefing commit. `services/ai/.xiv-runtime/` and
   `services/ai/provision-12d-99.ts` are untracked and NOT in the MR.
8. **Unresolved security findings:** none open at the story level — every
   adversarial-review finding cited above was paid down with regression tests
   before its commit; the disclosed residuals (out-of-band receipt custody,
   self-consistent recomputed digests, PROCESS-LOCAL replay protection,
   digest-trust of composing plans) remain DISCLOSED in the handoffs and are
   unchanged. Independent approvals outstanding: GROK_XAI (never responded —
   not fabricated), CTO approval, CEO approval; MR remains draft and unapproved.
9. **Native CI (separate, authoritative):** pipeline 2848425397 at the exact head;
   `ai-service-typecheck` and `offline-brain-contracts` — no runner, never
   started, `ci_quota_exceeded`. Local totals (125/125 at 12D-222 + per-story
   suites) are DIAGNOSTIC ONLY and never CI facts.
10. **History-union vs final-surface delta (validated):** the union of
    changed files across the 71 commits is **270 paths**; the final
    `3f5e7fdc…faf39f08` diff — the MR's 268-file review surface — is 2 paths
    smaller because the two renumber commits DELETED their old-numbered
    handoff docs (`12d-132-declared-evidence-collector-handoff.md` by
    `8ba82881`; `12d-133-instruction-evidence-bridge-handoff.md` by
    `03b65576`). Nothing else differs (verified by set-difference in both
    directions, both empty otherwise). Per-story "Files" counts in Section 2
    are HISTORY unions and may include such deleted paths; the parser's
    surface-closure check (Section 4, rule 3) must compare against the FINAL
    268-path diff, not the history union.

## 4. Canonical ledger record schema (v1)

No ledger parser exists in this runtime; per the directive no parser was written.
The canonical machine-readable record shape for every story row (future story may
implement the parser + validation):

```json
{
  "storyId": "12D-222",
  "title": "instruction-side adoption & lineage reconciliation gate",
  "mr": "!114",
  "mergeBase": "3f5e7fdc378b8ba707e2a868dd14c17ba7e08812",
  "head": "faf39f087c8820acf3ffdb1e57888af038bd7d67",
  "commits": [{"sha": "<40-hex>", "parent": "<40-hex>", "subject": "<subject>"}],
  "changedFiles": ["<repo-relative paths>", "..."],
  "changedFileCount": 8,
  "localEvidence": {"source": "handoff doc + briefing rev 24", "tests": "9/9",
    "typecheck": "exit 0", "note": "LOCAL DIAGNOSTIC ONLY — never a CI fact"},
  "nativeCi": {"pipelineId": 2848425397, "state": "NEVER_STARTED",
    "reason": "ci_quota_exceeded", "jobsNeverStarted": ["ai-service-typecheck",
    "offline-brain-contracts"]},
  "review": {"selfReview": "CLAUDE_CODE", "independent": "GROK_XAI PENDING",
    "confirmedFindingsPaid": 0, "refutedDisclosed": 0},
  "residuals": ["<disclosed residual, verbatim from handoff>"],
  "dependsOn": ["12D-121", "12D-135", "12D-136"],
  "mergeAuthority": "CEO_ONLY", "deployAuthority": "CEO_ONLY",
  "trafficMoved": false, "providerCalls": 0, "modelCalls": 0, "remoteCalls": 0,
  "productionMutationAllowed": false, "mergeAuthorized": false,
  "deploymentAuthorized": false, "humanDecision": "REQUIRED",
  "learningPromoted": false, "automaticRecovery": false,
  "billionUsersProven": false,
  "supersession": {"status": "NONE | SUPERSEDED_BY | RENUMBERED_FROM | RENUMBERED_TO | BUNDLED_INTO",
    "relatedStoryId": null}
}
```

### Validation plan (to be executed by a future parser story — NOT built here)

1. **Id integrity:** every `storyId` matches `^12D-[0-9]{1,4}$`; no duplicates
   except records carrying `supersession.status ≠ NONE` with a resolvable
   `relatedStoryId`; the union of ids equals the census (12D-96, 97, 99–136,
   221, 222 for this MR — 40 ids).
2. **Commit closure:** every commit in `3f5e7fdc..faf39f08` appears in exactly
   one story row (or the NONE bucket); every listed SHA is an ancestor of the
   head and a descendant of the merge base; `parent` of the first commit =
   `3f5e7fdc…`; `parent` of `faf39f08` = `f1e2546b…`.
3. **Surface equality:** the union of `changedFiles` over all rows equals the
   MR's 268-file review surface, byte-for-byte; `changedFileCount` sums with
   dedupe to 268 (12D-117's 140 files make naive sums wrong — union, not sum).
4. **Flag closure:** every record asserts the closed-flag set in Section 2's
   preamble; any other value fails validation.
5. **CI honesty:** every `nativeCi.state` is `NEVER_STARTED` with the
   `ci_quota_exceeded` reason; no record may carry `PASSED` without a declared
   pipeline evidence id (12D-133 ledger rule, reused here).
6. **Supersession closure:** `12D-132 → 12D-221` and the `12D-133/134` chain
   resolve without cycles; `12D-105` and `12D-122` resolve to their bundling
   commits.
7. **Authority:** every record has `mergeAuthority: CEO_ONLY` and
   `mergeAuthorized: false`; no self-approval.

## Appendix A — MR !114 commit inventory (71 commits, oldest first)

Full 40-character SHAs, parents, and subjects, generated by
`git log --reverse --format='%H|%P|%s' 3f5e7fdc…faf39f08` (appended below this
paragraph in the file body by the same command's output).
```text
9bb73b5e08d9a535527704e4f223ce734718eb22 | parent 3f5e7fdc378b8ba707e2a868dd14c17ba7e08812 | feat(xiv): 12D-99 supervised end-to-end local worker
e3bd0fd3281e2b55042fe0f92602abca376a104a | parent 9bb73b5e08d9a535527704e4f223ce734718eb22 | feat(xiv): 12D-100 operator recovery for held leases and stale queue holds
141589448b321a0182bd7bfdd085ab7211b614ef | parent e3bd0fd3281e2b55042fe0f92602abca376a104a | feat(xiv): 12D-101 authenticated reviewer-response ingestion
5326fb5c6b45012bcbddc339605a42c82dc3b19f | parent 141589448b321a0182bd7bfdd085ab7211b614ef | test(xiv): raise capacity fixture ceiling to the 2M queue policy; record 2M-row run evidence
303896c177a8b227f62e4a724734197374e71a4c | parent 5326fb5c6b45012bcbddc339605a42c82dc3b19f | feat(xiv): 12D-102 bounded queue-lease renewal; plus progress report page
d1ade2ffe572a23753647af509b23be7111c7e74 | parent 303896c177a8b227f62e4a724734197374e71a4c | feat(xiv): 12D-103 2M-row operational drill with final full-scale evidence
143266c3eec9054a25c9fa37d5370a702697fdeb | parent d1ade2ffe572a23753647af509b23be7111c7e74 | feat(xiv): 12D-104 governed social ingestion registry; 12D-105 runtime mode governor
38f1adfbd616b2a505d389d8eb9c29caa9540ec3 | parent 143266c3eec9054a25c9fa37d5370a702697fdeb | feat(xiv): 12D-106 governed report composer with grammar + honest-claims gate
ec0d94d2458c59b61efb459657df822dbe8a0372 | parent 38f1adfbd616b2a505d389d8eb9c29caa9540ec3 | docs(xiv): MR !117 independent review — summary index validated 11x on disposable 2M copy
56ba6ac5d5b32036d200c5925894161027816c9e | parent ec0d94d2458c59b61efb459657df822dbe8a0372 | feat(brain): bridge reviewed queue outcomes into governed pathway candidates
ea07bfdd22bed9476ed05642d69dcddf2e7d7d7f | parent 56ba6ac5d5b32036d200c5925894161027816c9e | feat(device): add consent-bound device fleet enrollment and activation assessment
9110739b2c3ff2819aebe192388d5fbd5c3286f2 | parent ea07bfdd22bed9476ed05642d69dcddf2e7d7d7f | test(docs): wire pathway and device enrollment contracts into validation
2698317c47a63056999f55d1058120afd4155155 | parent 9110739b2c3ff2819aebe192388d5fbd5c3286f2 | docs(xiv): independent reviews — MR !118 SOUND; MR !117 remediation resolves blocking findings
19959de7f7cdabc7019ef8ac145b40a5c50992fa | parent 2698317c47a63056999f55d1058120afd4155155 | docs(xiv): MR !118 independent review — pathway bridge and device fleet SOUND
3fbc8feacb40009f26ca0f8353db3013bbefa8ff | parent 19959de7f7cdabc7019ef8ac145b40a5c50992fa | feat(xiv): 12D-107 control-tower evidence surface; 12D-108 device capability/health receipt ladder
5f9d1b821fe8438265862ce54c54537846e636a3 | parent 3fbc8feacb40009f26ca0f8353db3013bbefa8ff | feat(xiv): surface unexpired 12D-108 worker receipts on the control tower
9206832d7b1b232130a7da9c1090ac335e7b6b9c | parent 5f9d1b821fe8438265862ce54c54537846e636a3 | docs(xiv): MR !117 remediation — full governed 2M-row benchmark recorded
1e60decac169ede1b84a25c093bc751e639bcbd0 | parent 9206832d7b1b232130a7da9c1090ac335e7b6b9c | feat(xiv): 12D-110 storage feed hierarchy — local/offline/carrier/cloud tier contract
3be136bbc0a00ba20243e05ccbbc40d62a38e3fb | parent 1e60decac169ede1b84a25c093bc751e639bcbd0 | feat(xiv): 12D-109 queue partition/shard + tenant-routing contract (pure plan, no materialization; per-shard ceiling = proven 2M rows; advisory until adopted)
84886325c288b0bb93a279bce021966e87fb4797 | parent 3be136bbc0a00ba20243e05ccbbc40d62a38e3fb | feat(xiv): 12D-111 governed taskforce roster expansion proposals
a510b0a6ee4600b8fcc1b271eb6dfbc7b8513cdf | parent 84886325c288b0bb93a279bce021966e87fb4797 | docs(xiv): 2M drill evidence at 84886325 + cross-agent alignment briefing
cf895d9837e0323da82c7665aaf636619a40f3e9 | parent a510b0a6ee4600b8fcc1b271eb6dfbc7b8513cdf | feat(xiv): 12D-112 governed external tool integration registry (EXPO/LOVABLE/AMD/CHATGPT/GROK/OLLAMA) — intent + agreement posture only; LIVE stage unreachable by construction
965cc5737d4dc9f42bce3957ed996867eb59d05c | parent cf895d9837e0323da82c7665aaf636619a40f3e9 | feat(mobile): 12d-114 governed control-tower screen (Expo SDK 57)
101065862e848f9290b12f8e406ef275594663c8 | parent 965cc5737d4dc9f42bce3957ed996867eb59d05c | feat(xiv): 12D-115 governed loopback-only control-tower snapshot API (read-only route contract, off by default, operator-receipt-gated, honest flags on every payload)
9377acac9d09bb096587e29531cb5e222d11190f | parent 101065862e848f9290b12f8e406ef275594663c8 | 12D-116: governed agent training gate (proposals held, no outcome recording)
89252cba25eb63ef77d2d52688b3057fa8157d11 | parent 9377acac9d09bb096587e29531cb5e222d11190f | fix(xiv): 12D-115 exact-shape control-tower packet validation — closes blocking independent-review finding
9e9e1f2f55dbc542c5f5f283f62fd15ddfef594b | parent 89252cba25eb63ef77d2d52688b3057fa8157d11 | fix(mobile): 12D-114 review fixes + disclosed baseline node-types declaration
d2dd94f359eeff49dd7dd0a48bcd992f227b8276 | parent 9e9e1f2f55dbc542c5f5f283f62fd15ddfef594b | feat(xiv): 12D-113 mechanical alignment-invariant audit with shrink-only debt ledger
250fc26258d3ac0eaad3a78320e8043fdcef25f4 | parent d2dd94f359eeff49dd7dd0a48bcd992f227b8276 | docs(xiv): alignment briefing rev 2 — 12D-112..116 integrated, 12D-113 audit wired into the invariants
463bcbe815af2d6f75ddd74b8c12ce8134204b9e | parent 250fc26258d3ac0eaad3a78320e8043fdcef25f4 | 12D-117: pay down the full guardrails debt ledger
1388262d0640c6fc67435ec7d3d7a8a9c59b3f23 | parent 463bcbe815af2d6f75ddd74b8c12ce8134204b9e | 12D-117: alignment briefing rev 3 — debt ledger empty after full paydown
1ab31f2f84914b72514d097054f425e63184a4f5 | parent 1388262d0640c6fc67435ec7d3d7a8a9c59b3f23 | 12D-118: map the L0-L5 authority ladder onto all 100 workforce roles
8ce15f73ae0ad41fb7e4a7ca8b1cc806877f341a | parent 1ab31f2f84914b72514d097054f425e63184a4f5 | 12D-118: alignment briefing rev 4 — authority ladder mapped, 12D-99..118 integrated
ac9d786813656a60598c55f3e84a3f21611f2b69 | parent 8ce15f73ae0ad41fb7e4a7ca8b1cc806877f341a | feat(xiv): assess opt-in device participation without granting execution authority (12D-97)
aa0c544438fd5f75bb7aa2ab1b0f503e87e2eca3 | parent ac9d786813656a60598c55f3e84a3f21611f2b69 | 12D-96 x 12D-97 reconciliation: consent assessment rides the queue lineage
41e1e6966b1e971e6077ea8f7931bda1a8b0021e | parent aa0c544438fd5f75bb7aa2ab1b0f503e87e2eca3 | 12D-97 reconciliation follow-up: the reconciliation tests and handoff note
c522187b4b1a9643d63745efce87a861d02f3026 | parent 41e1e6966b1e971e6077ea8f7931bda1a8b0021e | alignment briefing rev 5 — 12D-97 lineage reconciled; lease-cap queued next
13c9b528d3792016092b354fd78b21d11f3d4ca5 | parent c522187b4b1a9643d63745efce87a861d02f3026 | fix(xiv): remove unresolved conflict marker from .gitlab-ci.yml; briefing rev 6 closes the lease-cap item as already-implemented
d432054088ada5a4832a592f6333f19db6cd615b | parent 13c9b528d3792016092b354fd78b21d11f3d4ca5 | 12D-119: tenant-routing adoption layer — 12D-109's advisory routing becomes operative over provisioned local shard queues
b819bfe26552b05be0d06c01ab99aa3201df40a1 | parent d432054088ada5a4832a592f6333f19db6cd615b | 12D-120: regional-cell placement contract (pure, materializes nothing, adversarially reviewed)
38d8197f02bfb89645b31d1daac9af99d69c9adc | parent b819bfe26552b05be0d06c01ab99aa3201df40a1 | briefing: cite exact integration head b819bfe2 (post-12D-120)
9e50d230cab9dbc83d306d201d7bae4dfd53a275 | parent 38d8197f02bfb89645b31d1daac9af99d69c9adc | 12D-121 decision-safety workflow + 12D-122 Story Engine screen
dc7b045484fe724995da11732af69bc5835fa116 | parent 9e50d230cab9dbc83d306d201d7bae4dfd53a275 | briefing: cite exact integration head 9e50d230 (post-12D-121/122)
52beacf1d518d6c8f012ea6e52f02b49884c9719 | parent dc7b045484fe724995da11732af69bc5835fa116 | 12D-123 distributed event + storage plane contract
109c74b31837fde77ed486127ba676e9ebfff10e | parent 52beacf1d518d6c8f012ea6e52f02b49884c9719 | briefing: cite exact integration head 52beacf1 (post-12D-123)
7daebb44e41c0dd55dd0998876dd09c24cbcfc60 | parent 109c74b31837fde77ed486127ba676e9ebfff10e | 12D-124: governed Story Engine backend contract
69684ce9e9bb5b75cc040b2e219b64ea1503e483 | parent 7daebb44e41c0dd55dd0998876dd09c24cbcfc60 | 12D-124 head-fix: alignment briefing rev 10
a6a74da805a8c11ef43e0af5d13ba9cee710d276 | parent 69684ce9e9bb5b75cc040b2e219b64ea1503e483 | briefing: record live brain-control verification (Windows host, 2026-09-14)
17b4030815c394619b8416dc89949e2839f95d9a | parent a6a74da805a8c11ef43e0af5d13ba9cee710d276 | 12D-125: governed Business Health Score contract — derived-never-arbitrary, fail-closed
80c97bc9783b1a0e303c3312d1b3eb3929677de6 | parent 17b4030815c394619b8416dc89949e2839f95d9a | 12D-124 head-fix: signal exact-shape gate + sub-structure freeze (12D-125 review lessons)
a0f8c7a7c289e4f3d7c7df4fdd737ee2070203ac | parent 80c97bc9783b1a0e303c3312d1b3eb3929677de6 | Briefing rev 11: 12D-125 Business Health Score contract + head sha
fa7c2877fffa7f5e301501b0be0c024d853c72f8 | parent a0f8c7a7c289e4f3d7c7df4fdd737ee2070203ac | 12D-126: measured regional failover contract — canary-only, digest-bound, fail-closed
ce6e5b54ad8b62faa465948d67ca40f194c257fd | parent fa7c2877fffa7f5e301501b0be0c024d853c72f8 | Briefing rev 12: 12D-126 measured regional failover review + paydown; head sha
501b831284f2d29e649a7da7cb99c49002bb0926 | parent ce6e5b54ad8b62faa465948d67ca40f194c257fd | 12D-127: receipt-gated human decision records for failover plans
1b907a90e29d23697e046d92e158b8be65f4ecdf | parent 501b831284f2d29e649a7da7cb99c49002bb0926 | Briefing rev 13: 12D-127 failover decision records; head sha
f9e99f84e4bca2c0d076ff152dd8f8a39e89ef53 | parent 1b907a90e29d23697e046d92e158b8be65f4ecdf | 12D-128: failover plan provenance re-derivation at the decision record boundary
d859fb21b43acaf08be8714ecdec28a6dc321a23 | parent f9e99f84e4bca2c0d076ff152dd8f8a39e89ef53 | Briefing rev 14: 12D-128 provenance re-derivation; head sha
c6543764ee627084d8e5c9a86f0f30d9c36bbb8d | parent d859fb21b43acaf08be8714ecdec28a6dc321a23 | 12D-129: measured horizontal scaling contract — smallest-K fleet expansion, per-database ceiling denial, provenance-verified decision records
cdec92661b0fe266896a7b62cbf57a5edcbbbdf9 | parent c6543764ee627084d8e5c9a86f0f30d9c36bbb8d | Briefing rev 15: 12D-129 measured horizontal scaling; head sha
4e024d097d13069df8d6fddedfd35d4e9f98038c | parent cdec92661b0fe266896a7b62cbf57a5edcbbbdf9 | 12D-130: scaling execution-instruction bridge — 12D-129 decision records drive the 12D-121 gate ladder; decision records now bind themselves (recordDigest)
c4ebf03de0da97b91dc9f32b5fc8d4e8a89d2ae2 | parent 4e024d097d13069df8d6fddedfd35d4e9f98038c | Briefing rev 16: 12D-130 scaling execution bridge + recordDigest paydown; head sha
bf6426ea8034f49fe28b77e65e3ea2ff46c89c62 | parent c4ebf03de0da97b91dc9f32b5fc8d4e8a89d2ae2 | 12D-131: failover execution-instruction bridge — 12D-127/128 decision records drive the 12D-121 gate ladder; failover records now bind themselves (recordDigest)
ca5333506e4e6c6469e8ad2737b8a15328805699 | parent bf6426ea8034f49fe28b77e65e3ea2ff46c89c62 | Briefing rev 17: 12D-131 failover execution bridge + failover recordDigest paydown; head sha
9c5465e88ddf89a83c4cc368cdad76ae960594d2 | parent ca5333506e4e6c6469e8ad2737b8a15328805699 | 12D-132: scaling & failover declared-evidence collectors (fail-closed, redacted, hash-bound)
a0e8e316cb345f0f1c33ec030887e936f28f8bf4 | parent 9c5465e88ddf89a83c4cc368cdad76ae960594d2 | 12D-133: instruction-evidence bridge — trail-verified declared evidence intake
03b65576fda198a3a179c19f475c6dcc187bfd17 | parent a0e8e316cb345f0f1c33ec030887e936f28f8bf4 | 12D-134: renumber the instruction-evidence bridge (12D-133 reassigned by CEO)
150cc65932beeb66f5d7dff61e1204632bcc5a91 | parent 03b65576fda198a3a179c19f475c6dcc187bfd17 | 12D-133: release-lineage consolidation & validation ledger (read-only)
312b236ac39a2838f62142896acf92e558e619d7 | parent 150cc65932beeb66f5d7dff61e1204632bcc5a91 | 12D-135: event-plane adoption layer — receipt-gated operative adoption + EventRoutedStreams facade
8ba8288153399657a8891ce4b373031a110e3cca | parent 312b236ac39a2838f62142896acf92e558e619d7 | 12D-221: renumber the scaling & failover observed-evidence collectors (was 12D-132)
f1e2546b64f8421f6fb224decc39ebf54b982da4 | parent 8ba8288153399657a8891ce4b373031a110e3cca | 12D-136: cell-placement adoption & event-plane binding layer
faf39f087c8820acf3ffdb1e57888af038bd7d67 | parent f1e2546b64f8421f6fb224decc39ebf54b982da4 | 12D-222: instruction-side adoption & lineage reconciliation gate
```
