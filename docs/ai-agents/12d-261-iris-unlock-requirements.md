# 12D-261 — Iris-Recognition Unlock: Integration Requirements (requirements only)

Status: REQUIREMENTS DOCUMENT — no code, no biometric capture, no claims.
This is the CTO-AI drafting the integration requirements the CEO approved
("Shall we have the CTO AI draft the integration requirements for Iris
Recognition into the XIV Twelve Zero-Trust framework?" — answered "lets
continue working"). humanDecision: REQUIRED throughout. **DECLARED NOT
PROVEN**: no iris-recognition capability exists anywhere in this codebase,
none is claimed, and none will be implemented without separate stories,
adversarial review, and operator authorization.

## The corrected direction (what the CEO approved)

The browser-relay analysis the CEO endorsed, restated as XIV requirements:

1. **Iris recognition, NOT pupil tracking.** Pupil tracking answers "where
   is the user looking" (attention/navigation); it is not a biometric
   identifier. Authentication uses the iris — the stable ring pattern —
   as a spoof-resistant identifier. Any claim about exact false-accept
   rates is DEFERRED to a measured, cited evaluation before this number
   ever appears in a packet (never fabricated).
2. **Active, opt-in unlock — never background surveillance.** The camera
   runs ONLY during a deliberate unlock gesture, and turns off
   immediately after authentication (or deliberate continued
   interaction). No background camera. Mobile OS constraints (Android
   10+ / iOS foreground-camera policy) are treated as aligned, not as
   obstacles: XIV does not want background camera either.
3. **Wellbeing without surveillance, verbatim.** Continuous camera
   watching violates the Master Plan pillar "MENTAL HEALTH SECOND:
   Wellbeing without surveillance" and is therefore OUT OF SCOPE by
   principle, not merely by platform policy.
4. **The twin serves; it never silently controls.** A digital twin may
   observe, recommend, draft, and orchestrate; consequential execution
   stays human-governed (the 12D-247 custody stack / Decision Safety
   Workflow levels). "A twin that silently takes over the phone"
   contradicts the Master Plan's human-authority principle and is
   rejected at the requirements level.
5. **Zero Trust retained:** possession of a face or an eye is a KEY, not
   an authority grant. Unlock opens the user's private universe; every
   consequential decision still flows through the human custody chain
   (12D-233/12D-236/12D-247), exactly as every other surface does.

## Integration requirements (the deliverable of this story)

R1. **Opt-in enrollment, revocable.** Iris enrollment is an explicit
    operator act with plain-language disclosure of what is captured,
    where templates live (LOCAL plane only), and how to delete them.
    Biometric templates NEVER leave the device; remoteCalls 0.
R2. **Active-gaze unlock only.** Authentication requires a deliberate
    user gesture; the capture surface is active for the minimum window
    needed and closes immediately after the verdict.
R3. **Camera-off guarantee.** The unlock flow ends with the camera
    OFF, and the OS camera indicator state is part of the contract —
    a test asserts the surface cannot silently re-open.
R4. **Fail-closed verdicts.** Ambiguous captures, low-quality frames,
    spoof suspicion (photo/screen), and engine unavailability all
    resolve to LOCKED — never to a best-guess unlock. (Same shape as
    every XIV gate: a refusal is an honest answer.)
R5. **Biometrics unlock, custody decides.** Successful iris unlock
    opens the LOCAL universe. It grants NO authority in the custody
    stack: registering receipts, consuming them, and every
    humanDecision REQUIRED surface remain exactly as they are.
R6. **Declared-not-proven disclosure.** Until a measured evaluation
    exists, every packet touching this surface carries:
    `biometricCapability: 'DECLARED_NOT_PROVEN'`,
    `billionUsersProven: false`, `humanDecision: 'REQUIRED'`,
    `learningPromoted: false`, `remoteCalls: 0`.
R7. **Template custody is a custody story.** Iris templates are
    operator-custody material: they belong in the 12D-233/12D-236
    custody discipline (registered evidence, single-use consumption,
    hash-chained journal) — a future story reusing the existing
    chain, not a parallel system.
R8. **No hardware/cloud claims.** No claim that any specific camera,
    phone, or cloud service is supported, and no quantum/biometric
    hardware claims of any kind, until measured on real hardware.

## What this story did NOT do

- No camera code, no image capture, no biometric template math, no
  vendor SDK evaluation, no device claims.
- No modification of any existing custody/auth surface.

## Next candidates gated on this document

A future story may define the pure unlock-gate CONTRACT (verdict-type
state machine: AWAITING_GESTURE → CAPTURING → VERIFIED/LOCKED, with
fail-closed transitions and the camera-off guarantee as an asserted
postcondition) — testable without any camera hardware, in the 12D-240
declared-not-proven pattern. Hardware evaluation and any enrollment
flow remain future stories requiring explicit CEO authorization.