// 12D-254 — Story-Shell View Model: the fail-closed rendering contract that
// sits between a raw packet arriving "over the wire" and the XIV OS web
// front-end (services/xiv-story-shell). The UI NEVER sees a raw packet: it
// renders ONLY the frozen view model this module returns.
//
// Rules, structurally enforced:
//   * ALL-OR-NOTHING: a packet is either fully verified
//     (verifyStoryShellPacket — digest re-derivation, exact keys, pinned
//     guardrails) or the view model is a REFUSAL. A tampered packet never
//     renders partially — no headline with a wrong body, no "most of" a
//     decision surface.
//   * NO APPROVE CONTROL: the verified view model exposes the packet's
//     decision surface (kind APPROVAL_REQUIRED, humanDecision REQUIRED)
//     for DISPLAY only. It carries no action descriptors, no endpoints, no
//     approve/deny affordances — the decision is made by the operator in
//     the custody stack (12D-247), never through the shell.
//   * REFUSALS ARE HONEST: a refused view names the verifier's exact
//     reason and renders as HUMAN DECISION REQUIRED / refused — never as
//     an empty success, never as content.
//   * This module is PURE: no fs, no network, no clock, no randomness.
//     modelCalls: 0, remoteCalls: 0. It reads nothing but its argument.
//
// Disclosed residuals:
//   * A verified view model proves the BYTES are intact, not that the
//     content is true — the shell renders claims, it does not witness them.
//   * The refusal message text comes from the wire verifier; it is shown
//     to the operator as diagnostics, never parsed for control flow.

import {
  verifyStoryShellPacket,
  XIV_OS_WIRE_POLICY,
  type StoryShellPacket,
} from './xiv-os-wire-contract';

export const STORY_SHELL_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-254-v1',
  domain: 'XIV_OS_STORY_SHELL_VIEW_MODEL',
});

export const STORY_SHELL_VIEW_MODEL_GUARDRAILS = Object.freeze({
  verifyBeforeRender: true, // all-or-nothing; no partial renders
  noApproveControl: true, // the shell never decides
  refusedRendersAsRefused: true, // never an empty success
  pureModule: true, // no fs, no clock, no randomness, no network
  modelCalls: 0,
  remoteCalls: 0,
  collectsNothing: true,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

export type StoryShellViewModel =
  | Readonly<{
      kind: 'VERIFIED_PACKET';
      policyVersion: string;
      packet: Readonly<StoryShellPacket>;
      display: Readonly<{
        headline: string;
        bodyText: string;
        storyId: string;
        generatedAtMs: number;
        avatarId: string | null;
        decidingOver: string;
        decisionKind: 'APPROVAL_REQUIRED';
        humanDecision: 'REQUIRED';
        /** Display-only reminder; the shell renders this, never an approve button. */
        operatorNote: string;
      }>;
    }>
  | Readonly<{
      kind: 'REFUSED';
      policyVersion: string;
      reason: string;
      display: Readonly<{
        headline: string;
        bodyText: string;
        operatorNote: string;
      }>;
    }>;

const REFUSAL_HEADLINE = 'Packet refused — HUMAN DECISION REQUIRED';

/**
 * The only door from raw wire bytes to the UI. Accepts ANY unknown value
 * (a JSON.parse result, a fetch body, whatever arrived); returns a frozen
 * view model that is either fully verified or an honest refusal. Never
 * throws — a throw would crash the shell instead of refusing it.
 */
export function buildStoryShellViewModel(raw: unknown): StoryShellViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('a story-shell packet object is required; fail closed');
    // verifyStoryShellPacket throws on ANY tamper (shape, guardrails,
    // decision surface, digest). Nothing below runs unless it passes.
    verifyStoryShellPacket(raw as StoryShellPacket);
    const packet = raw as StoryShellPacket;
    return Object.freeze({
      kind: 'VERIFIED_PACKET' as const,
      policyVersion: STORY_SHELL_VIEW_MODEL_POLICY.policyVersion,
      packet: Object.freeze(raw as StoryShellPacket),
      display: Object.freeze({
        headline: packet.headline,
        bodyText: packet.bodyText,
        storyId: packet.storyId,
        generatedAtMs: packet.generatedAtMs,
        avatarId: packet.avatar === null ? null : packet.avatar.avatarId,
        decidingOver: packet.decisionSurface.decidingOver,
        decisionKind: 'APPROVAL_REQUIRED' as const,
        humanDecision: 'REQUIRED' as const,
        operatorNote: `Verified against wire policy ${XIV_OS_WIRE_POLICY.policyVersion}. The decision surface is APPROVAL_REQUIRED — decide in the custody stack, never through this shell.`,
      }),
    });
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: STORY_SHELL_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'The packet failed verification and was NOT rendered. Nothing is shown from it — not partially, not summarized. Diagnostics below are for the operator.',
        operatorNote: 'Refused. Deliver a verified packet, or decide in the custody stack.',
      }),
    });
  }
}