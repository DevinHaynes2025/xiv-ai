# 12D-240 — XIV Virtual Chip: hardware-adapter declaration registry (handoff)

Status: BUILT AND GREEN LOCALLY on `claude/12d-99-supervised-local-worker`
(`services/ai/runtime/offline-team/xiv-virtual-chip.ts` + 13/13 focused
tests + strict typecheck green). CI IS NOT CLAIMED PASSED: GitLab CI remains
quota-blocked (`ci_quota_exceeded`); the `.gitlab-ci.yml` wiring was appended
but no native pipeline has executed on it. Reviewers: CLAUDE_CODE
(self-review; one self-contradictory test assertion caught by the suite and
rewritten positive — see below). GROK_XAI PENDING — never fabricated.

## What it is

The honest engineering surface for the CEO's 2026-09-15 direction ("virtual
XIV chips compatible with every CPU, GPU, NPU on earth; the first quantum AI
agent OS"). The registry is a fail-closed DECLARATIONS ledger:

1. **Declared, not proven.** An adapter's compatibility is `DECLARED` by the
   operator; `proven` is PINNED to `false` and is not an accepted input.
   There is NO promotion path in this contract — `promoteToProven` exists
   ONLY to refuse, with the exact message that measured-compatibility proof
   requires a drill story (the 12D-103 pattern: synthetic capacity fixture +
   operational drill), which is a future, separately reviewed story.
2. **Quantum is an aspiration, never a claim.** `quantumPathProven: false` is
   a pinned structural flag on every record and on the guardrail set —
   `quantum` is an allowlisted DECLARATION architecture, and a quantum
   adapter declares with the same unproven honesty as any other. Nothing in
   this contract asserts quantum capability, a quantum device, or any
   hardware at all: the registry touches NOTHING physical — no driver, no
   device open, no kernel interaction (`touchesNoPhysicalDevice: true`,
   audited on the class surface by test).
3. **Digest-bound declarations.** `adapterId` IS the sha256 over the
   canonical fixed-key-order declaration (domain-tagged `XIV_VIRTUAL_CHIP_
   ADAPTER`, genesis-bound — a different registry genesis derives a different
   digest for identical inputs). `verifyVirtualChipAdapter(adapter, genesis)`
   re-derives; a tampered name, a forged digest, a compatibility CLAIM
   (`proven: true`), or a smuggled field (`apiKey`) all refuse.
   `registry.verify()` walks every declared adapter.
4. **Declared exactly once.** A duplicate exact declaration (same digest)
   refuses for the registry's lifetime; any input difference is a distinct
   digest and legitimately registers.
5. **Honest flags on every record** (frozen): `humanDecision: 'REQUIRED'`,
   `remoteCalls: 0`, `modelCalls: 0`, `learningPromoted: false`,
   `automaticRecovery: false`, `billionUsersProven: false`,
   `touchesNoPhysicalDevice: true`.
6. **Local plane only.** `zeroRemoteCalls` — the registry declares, lists,
   and verifies; it calls nothing remote, ever.

## Disclosed residuals

- A DECLARED adapter is a declaration only — vendor authenticity is
  out-of-band operator custody (12D-233's registration-is-not-issuance-proof
  carries over verbatim: a declaration fed by an impostor records the
  impostor's).
- Durability across a process restart is the 12D-236/237 pattern and is NOT
  re-solved here; one registry instance per deployment remains single-writer
  operator discipline.
- "Compatible with every digital product" is a long-horizon ASPIRATION —
  never a property of this contract. Nothing is universal until measured.

## Defects found and paid down during this story

- **(self-review, before any test ran):** the first write left duplicate
  `VERIFIED_ADAPTER_KEYS` declarations and stray closing parens across
  several gates — rewritten clean in one pass; no test was relaxed and none
  had run against the broken draft.
- **(test-authoring error, caught by the suite):** the forge-surface test
  asserted `assert.throws` around a re-declaration that LEGITIMATELY
  succeeds (a fresh registry has no duplicate). Rewritten as a positive
  assertion — the re-declaration succeeds AND verifies. No implementation
  change; the test was wrong, the contract was right.

## Exact files

- `services/ai/runtime/offline-team/xiv-virtual-chip.ts` (new)
- `services/ai/runtime/offline-team/xiv-virtual-chip.test.ts` (new, 13 tests)
- `services/ai/package.json` (`test:12d-240`, `typecheck:12d-240`)
- `.gitlab-ci.yml` (`typecheck:12d-240`, `test:12d-240` appended)
- `docs/ai-agents/12d-240-xiv-virtual-chip-registry-handoff.md` (this file)

## Exact commands and local results

```
npm run test:12d-240      # 13/13 pass, exit 0
npm run typecheck:12d-240 # exit 0 (strict)
npm run test:12d-239      # 13/13, exit 0
npm run test:12d-238      # 11/11, exit 0
npm run test:12d-237      # 12/12, exit 0
```

CI: NOT RUN, NOT CLAIMED — `ci_quota_exceeded` persists.

## Approval status

`modelCalls: 0`, `remoteCalls: 0`, no provisioning, no traffic shifting, no
production mutation, no merge, no deployment, no learning promotion, no
Ollama/provider invocation, and NO physical-device interaction of any kind
occurred in this story. The commit stages ONLY the five files above and never
touches `services/ai/.xiv-runtime/` or `services/ai/provision-12d-99.ts`.