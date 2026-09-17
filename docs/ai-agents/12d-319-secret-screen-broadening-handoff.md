# 12D-319 — The Credential-Shape Screen Broadened (the 12D-318 Observation Paid Down)

**Story rung:** 12D-319 · **Policy:** the REAL `12d-267-v1` secret
re-gate discipline (the screen lives inside every validator; this rung
broadens its shapes — no new policy version; the regex's contract is
"credential-shaped content never passes a door") · **Parents:** 12D-318
(the defensive observation) / 12D-267 (secret re-gate inside the
validator) / 12D-280 (the first reader re-applies the same screen)

## What this rung is

12D-318 disclosed a measured gap: a **live CircleCI badge token**
(`circle-token=<40 hex>` in a commented-out badge URL) sailed through
the public typesense README and past the secret screen — the screen
knew `sk-…`, `gh[pousr]_…`, `AKIA/ASIA…`, and private-key headers, but
not URL-query tokens. This rung pays that down: the screen is
**broadened conservatively** across every door that uses it, with the
old shapes unchanged and benign content still passing.

**New shapes refused** (each grounded in a real credential format):

- Stripe-style keys: `(sk|pk)_(test|live)_…`
- GitHub fine-grained PATs: `github_pat_…`
- GitLab PATs: `glpat-…`
- npm tokens: `npm_<36 alnum>`
- Google API keys: `AIza…<35>`
- Slack tokens: `xox[baprs]-…`
- **URL query tokens: `?token=`/`&x-token=` with 20+ chars** — the
  exact class the 12D-318 observation fell into (`&circle-token=<40
  hex>`)
- Bearer-authorization values: `Bearer <30+ chars>`

## Where the broadened screen lives (one contract, eight byte-identical copies)

The canonical export is `xiv-document-ingest.ts` `SECRET_CONTENT_RE`
(18 modules import it; the first reader re-applies the SAME regex to
model drafts — a model can never launder secrets into queue material).
Seven modules carry a byte-identical local copy by the codebase's
existing convention: `xiv-approval-custody`, `xiv-avatar`,
`xiv-os-wire-contract`, `xiv-pathway-approval-link`,
`xiv-reading-source-register`, `xiv-story-shell`, and the ingest
contract itself. **All eight were updated in lockstep** — verified by
`grep | sort -u` collapsing to exactly one line body across the tree.

Doors this immediately strengthens: 12D-274 ingest (documents), 12D-276
register (source URLs/titles/license notes), 12D-280 first reader
(drafts), the avatar/custody/pathway/shell surfaces (render-time
defense in depth), and every assistant-memory surface.

## Honest consequence on the live queue (disclosed, nothing hidden)

The 12D-318 typesense stories were admitted under the OLD screen, so
they remain in the queue (35 drafts AWAITING_REVIEW — review decisions
stay the CEO's). But **a fresh re-ingestion of that README now
refuses** until the operator redacts the badge-token line — exactly
the fail-closed direction: the door that let the shape through now
stops it. The continuation gate binds re-submissions to the admitted
bytes, and the ingest door's screen runs BEFORE admission, so a
re-submission attempt refuses at the screen with the token never
echoed.

## Adversarial tests (7 new, all through REAL doors)

- Every new shape matches; **every old shape still matches** (nothing
  loosened).
- **Benign content still passes** (10 pinned non-matches): short
  `token=abc`, prose about token *shapes*, `Bearer` alone / with short
  values, bare hex digests, `npm packages`, `AIza` in prose, `glpat-`
  prefix in prose, `pk_test_ short form` — the screen is conservative,
  fail-closed not fail-shut.
- The REAL 12D-274 ingest door refuses a body carrying the **exact
  12D-318 badge-token shape**, refusal message never echoes the token.
- The REAL 12D-274 door still admits the same badge WITHOUT the token
  (the refusal is about the credential, not the badge).
- The REAL 12D-276 register door refuses a source URL carrying
  `?token=<20+>` (token never echoed) and still admits a token-free
  URL of the same shape.

Before broadening, the whole test corpus was scanned for over-refusal
risk: the two files containing `token=`/`Bearer` shapes both exercise
DIFFERENT redaction mechanisms (phase2e URL redaction,
declared-evidence `redactDeclaredNote`), neither flows through
`SECRET_CONTENT_RE` — no fixture changed.

## Measured (local, nothing remote)

- `typecheck:12d-319` exit 0 (8 modified modules + the new suite).
- New suite **7/7**.
- **Full chain regression 1451/1451 across 246 files** (1444 + 7), 0
  failures — the broadened screen broke nothing anywhere in the chain.
- Python suites OK (17 + 20 = 37); shell build exit 0.
- Byte-identity of all eight copies verified by grep collapse.

## What this is NOT

- NOT a claim of exhaustive credential coverage: the screen is
  deliberately conservative; future shapes (JWTs, PASETOs, connection
  strings) remain disclosed residuals — a refusal is always safe, a
  pass is only as good as the pattern list.
- NOT a fix of already-admitted bytes: the queue's admitted stories are
  immutable history; review decisions remain the CEO's.
- NOT any learning/deploy/cloud action: flags unchanged
  (`learningPromoted false`, `activated 0`, `humanDecision REQUIRED`).

## Next candidates

1. CEO review decisions on the 35 drafts (clean slate).
2. Tenant-bound conversation summary surface over the 133-story queue.
3. Staleness→plan→real-doors operator flow wiring in the shell.
4. The eight-copy regex could collapse to ONE shared export (additive
   extraction, 12D-308 pattern) — a refactoring rung only if the
   review asks for it; the byte-identity check keeps the copies honest
   meanwhile.