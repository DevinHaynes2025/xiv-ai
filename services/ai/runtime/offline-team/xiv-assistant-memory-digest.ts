// 12D-306 — the PURE assistant-memory digest core, extracted verbatim
// from the 12D-305 module so the story shell's view model can RE-DERIVE
// the memory digest without value-importing the queue-touching 12D-305
// door (the 12D-286 lesson: queue doors are never shell-imported — the
// shell build must never pull node:sqlite into its type program).
// PURE module: node:crypto only — no fs, no network, no clock, no
// randomness. The 12D-305 module re-exports both names, so its public
// surface is unchanged.
import { createHash } from 'node:crypto';

export interface AssistantMemoryEntry extends Readonly<{
  storyId: string;
  outputHash: string;
  objective: string;
  objectiveTruncated: boolean;
}> {}

/** sha256 over the canonical JSON of the entries — the caller re-derives this
 *  before trusting the memory (the 12D-301 discipline: digests are never trusted). */
export function deriveAssistantMemoryDigest(entries: readonly AssistantMemoryEntry[]): string {
  return createHash('sha256').update(JSON.stringify(entries.map((e) => ({
    storyId: e.storyId, outputHash: e.outputHash, objective: e.objective, objectiveTruncated: e.objectiveTruncated,
  })))).digest('hex');
}