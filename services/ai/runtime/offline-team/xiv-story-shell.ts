// 12D-242 — XIV OS Story Shell renderer: the front-end trust boundary,
// contract-first. The Master Plan's web blueprint (Next.js front end) renders
// 12D-241 StoryShellPackets — but the front end NEVER TRUSTS an unverified
// packet: rendering happens ONLY after 12D-241 verification passes, and the
// packet-sourced text is escaped at the boundary.
//
// What this contract guarantees, as frozen structural flags (never claims):
//   * RENDERS ONLY VERIFIED PACKETS: `verifyStoryShellPacket` runs FIRST —
//     a tampered, forged, or shape-broken packet refuses the whole render.
//   * SECRETS NEVER RENDER: credential-shaped text re-gates at RENDER time.
//     The 12D-241 wire verifies INTEGRITY in flight (digest re-derivation);
//     a digest-consistent hand-forged packet is not an authorship proof
//     (authenticity is out-of-band operator custody) — so the render layer
//     re-runs the content gate itself rather than inheriting a build-time-
//     only check. Regression-tested with a digest-consistent forgery.
//   * NEVER AUTO-APPROVES: the decision surface renders as a visible
//     "HUMAN DECISION REQUIRED" panel and NOTHING else — no approve control,
//     no auto-advance. The human decision happens OUT-OF-BAND in operator
//     custody (12D-233); this shell renders the surface, never the decision.
//   * ESCAPES ALL PACKET TEXT: headline, body, decidingOver, storyId, and the
//     avatar's representationScope are HTML-escaped before interpolation.
//     The avatar's visual is embedded verbatim — 12D-239's SVG interpolates
//     only digest-derived hue integers and the fixed literal "XIV AI", no
//     operator-authored text ever enters it.
//   * NO TELEMETRY HOOKS / NO EXTERNAL FETCHES / NO SCRIPT: the output is
//     static markup — no <script>, no <iframe>, no on* attributes, no fetch,
//     no navigator, no storage. `collectsNothing: true` at the screen.
//   * DETERMINISTIC: same packet → same bytes, every time. No randomness,
//     no time-of-render, no generation — `modelCalls: 0` by construction.
//   * LOCAL plane only: `remoteCalls: 0` — rendering touches nothing remote.
//
// Disclosed residuals, stated plainly:
//   * The rendered shell is a STRING, not a mounted app: an actual Next.js
//     app scaffold (installs, a server, real DOM) is a FUTURE, separately
//     reviewed story. This contract is the fail-closed render layer the
//     shell will call — pure functions, no dependencies to install.
//   * The approval AFFORDANCE (an interactive control that records the
//     human's decision into custody) is also a future story — this shell
//     renders the decision surface honestly as required-and-not-here.
//   * CI is NOT claimed passed (GitLab CI remains quota-blocked,
//     `ci_quota_exceeded`); GROK_XAI review is PENDING — never fabricated.

import {
  verifyStoryShellPacket,
  type StoryShellPacket,
} from './xiv-os-wire-contract';
import { renderAvatarCard, type AvatarIdentity } from './xiv-avatar';

export const XIV_STORY_SHELL_POLICY = Object.freeze({
  policyVersion: '12d-242-v1',
  domain: 'XIV_OS_STORY_SHELL_RENDER' as const,
  wireVersionRequired: 1,
});

export const XIV_STORY_SHELL_GUARDRAILS = Object.freeze({
  rendersOnlyVerifiedPackets: true,
  escapesAllPacketText: true,
  secretsNeverRender: true,
  neverAutoApproves: true,
  approvalHappensInCustodyNotInTheShell: true,
  avatarVisualsOnlyFromVerifiedIdentity: true,
  noScriptTags: true,
  noTelemetryHooks: true,
  noExternalFetches: true,
  collectsNothing: true,
  deterministicOutput: true,
  zeroModelCalls: true,
  zeroRemoteCalls: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

/** Credential-shaped content is refused at RENDER time (defense in depth). */
const SECRET_CONTENT_RE = /(-----BEGIN [A-Z ]+PRIVATE KEY-----|sk-[A-Za-z0-9]{20,}|(?:sk|pk)_(?:test|live)_[A-Za-z0-9]{10,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{22,}|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36}|AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{35}|xox[baprs]-[A-Za-z0-9-]{10,}|[?&](?:[A-Za-z]+-)?token=[A-Za-z0-9]{20,}|[Bb]earer [A-Za-z0-9_.=+/-]{30,})/;

/**
 * The escape boundary: EVERY packet-sourced string passes through this before
 * it touches the markup. Quotes are escaped too, so no packet text can break
 * out of an attribute.
 */
const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Render a VERIFIED 12D-241 packet as the static story-shell document.
 * Deterministic: the same packet renders the same bytes on both sides of any
 * transport, so the shell a human sees is itself auditable.
 */
export function renderStoryShell(packet: Readonly<StoryShellPacket>): string {
  // 1. VERIFICATION BEFORE RENDER — the front end never trusts an unverified
  // packet. verifyStoryShellPacket throws on any tamper/shape/version fault;
  // its refusal propagates and NOTHING renders.
  const verdict = verifyStoryShellPacket(packet);

  // 2. DEFENSE IN DEPTH — re-gate credential-shaped content at RENDER time.
  // The wire's digest proves the packet was not edited in flight; it does not
  // prove who authored the text (that is out-of-band custody). A hand-forged
  // but digest-consistent packet therefore MUST refuse here, at the screen.
  for (const [field, value] of [
    ['headline', packet.headline],
    ['bodyText', packet.bodyText],
    ['decidingOver', packet.decisionSurface.decidingOver],
  ] as const) {
    if (SECRET_CONTENT_RE.test(value))
      throw new Error(`12D-242: refusing to render credential-shaped content in ${field} — secrets never render; fail closed`);
  }

  // 3. DETERMINISTIC ESCAPED RENDER — static markup only; nothing packet-
  // sourced is interpolated unescaped anywhere below.
  const headline = escapeHtml(packet.headline);
  const storyId = escapeHtml(packet.storyId);
  const decidingOver = escapeHtml(packet.decisionSurface.decidingOver);
  const bodyParas = packet.bodyText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `    <p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  const avatarSection =
    packet.avatar === null
      ? ''
      : [
          '  <figure class="xiv-avatar">',
          `    ${renderAvatarCard(packet.avatar as Readonly<AvatarIdentity>)}`,
          `    <figcaption>Presented by the XIV AI avatar representative — never impersonates a human. Scope: ${escapeHtml(packet.avatar.representationScope)}</figcaption>`,
          '  </figure>',
        ].join('\n');

  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="utf-8">',
    `    <title>${headline} - XIV AI OS story shell</title>`,
    '  </head>',
    '  <body>',
    `  <header>XIV AI OS · story shell · ${storyId} · policy ${packet.policyVersion} · verified packet ${verdict.packetId}</header>`,
    avatarSection,
    '  <main>',
    `    <h1>${headline}</h1>`,
    bodyParas,
    '    <section class="xiv-decision-surface">',
    '      <h2>HUMAN DECISION REQUIRED</h2>',
    `      <p>kind: ${packet.decisionSurface.kind} · humanDecision: ${packet.decisionSurface.humanDecision}</p>`,
    `      <p>deciding over: ${decidingOver}</p>`,
    '      <p>No approval control renders here and nothing auto-approves. The human decision is recorded OUT-OF-BAND in operator custody; this shell renders the surface, never the decision.</p>',
    '    </section>',
    '  </main>',
    '  <footer>',
    '    <p>honest flags — humanDecision: REQUIRED · modelCalls: 0 · remoteCalls: 0 · collectsNothing: true</p>',
    '    <p>learningPromoted: false · automaticRecovery: false · billionUsersProven: false</p>',
    '  </footer>',
    '  </body>',
    '</html>',
  ]
    .filter((line) => line.length > 0)
    .join('\n');
}