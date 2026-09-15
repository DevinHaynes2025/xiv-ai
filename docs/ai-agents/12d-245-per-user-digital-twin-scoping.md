# 12D-245 (CANDIDATE — SCOPING ONLY, NOT BUILT) — XIV OS per-user digital twin & identity fingerprint

Status: **SCOPING NOTE ONLY** — written 2026-09-15 in response to the CEO's
directive ("every user to have an identical digital AI-agentic twin on
their mobile devices… every soul will have a digital fingerprint, and an
avatar identical to their characteristics"). No code for this story exists
yet; it is queued behind the landed 12D-239..244 chain and the open
12D-243 scoping questions.

## The honest boundary (fail-closed, stated first)

- **"Identical twin" as a claim that the software BECOMES the user is
  false, and no packet will ever make it.** A profile + avatar can assist
  a person; it cannot BE the person. This is the same structural boundary
  as 12D-243: 12D-239's `presentedAsHuman: false` / `neverImpersonatesAHuman:
  true` carries over VERBATIM — the twin never impersonates its own user,
  never speaks AS them, never claims their identity anywhere.
- **"Digital fingerprint" = a digest-bound cryptographic identity handle,
  NOT biometrics.** The honest build: a user-authored profile whose id IS
  its digest (the 12D-241 pattern — ids are re-derived, never invented).
  No biometric collection, no device-fingerprinting of users without
  their authored consent, nothing collected that the user did not write.
- **`collectsNothing` governs the twin too.** The profile lives on the
  USER'S device, authored by the USER (the 12D-239 operator-authored
  pattern, applied to the self): characteristics enter only as statements
  the user wrote and consented to, under a `consentRef`, with
  `humanDecision: 'REQUIRED'` on every twin surface. No telemetry, no
  ambient profiling, no engagement optimization on the twin — the
  mental-health-second pillar applies to a surface that talks to one
  person all day.
- **Mobile is a future surface.** This session's contracts are
  pure-TypeScript, dependency-free and local-plane; an actual mobile
  app (installs, signing, app stores) is a separately reviewed story
  needing per-use authorization. The candidate scope below is the
  CONTRACT the mobile surface would call.

## What the honest build IS (candidate scope)

- **User identity profile ledger** (12D-236 journal pattern): digest-bound,
  tamper-evident, local — statements about the user, authored by the user,
  each with a consentRef and an editor path (the user can amend; history
  stays in the journal, nothing is silently rewritten).
- **Twin behavior surface**: the 12D-239 avatar card personalized from the
  profile's digest — deterministic visuals only; language generation stays
  OUT (the 12D-239 `modelCalls: 0` residual carries over verbatim until a
  separately-reviewed governed-model story exists).
- **A "digital fingerprint" handle**: the profile's root digest, verifiable
  on both sides of any future wire (12D-241 pattern), never claimed to be
  a government-grade identity or a biometric.
- **Custody on consequential ops**: if the twin ever acts on the user's
  behalf, each consequential op is a receipted custody op (12D-233/244
  runner pattern) with `humanDecision: 'REQUIRED'` — the twin PROPOSES,
  the human DECIDES. "Autopilot" without per-op custody is refused
  structurally, not rhetorically.

## Open questions for the operator (humanDecision REQUIRED)

1. What profile statements are in scope, and who reviews them for a solo
   user (the user themself — confirm)?
2. Does the twin ever act without per-op confirmation, and if so where is
   the honest line (e.g. read-only lookups yes, anything spending,
   sending, or deleting — never without a receipt)?
3. Cross-device sync of the profile (a future wire story) — encrypted,
   consent-scoped, or local-only first?

**Not started.** Nothing of 12D-245 exists in the tree yet; this file is
the only artifact of the directive so far, and it never claims otherwise.