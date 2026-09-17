// 12D-316 — Stale-Source Re-ingestion Plan VIEW MODEL: the frozen render
// of the plan packet. Fail closed like its siblings: exact keys in order
// for each status, and the ENTIRE plan re-derived from the packet's OWN
// inputs through ONLY real contracts — the REAL 12D-306 memory gate
// re-runs, the REAL 12D-315 staleness contract re-derives the STALE row
// and both digest heads, the REAL 12D-274 ingest door re-derives the
// successor digest, chunk count and every story — a packet whose lineage,
// digest, story ids or stories do not match that re-derivation refuses
// with NOTHING rendered. Honest flags enforced.
import {
  STALE_REINGEST_PLAN_POLICY,
  type StaleReingestPlanPacket,
} from './xiv-stale-reingest-plan';
import { buildAssistantMemoryViewModel } from './xiv-assistant-memory-view-model';
import { prepareSourceStalenessCard } from './xiv-source-staleness-card';
import { prepareDocumentStories } from './xiv-document-ingest';

export const STALE_REINGEST_PLAN_VIEW_MODEL_POLICY = Object.freeze({
  policyVersion: '12d-316-v1',
  domain: 'XIV_OS_STALE_REINGEST_PLAN_VIEW_MODEL',
});

export const STALE_REINGEST_PLAN_VIEW_MODEL_GUARDRAILS = Object.freeze({
  planReDerivedFromTheInputs: true,
  onlyRealContractsReRun: true,
  lineageRenderedInFull: true,
  nothingAdmittedRenderedAsNothingAdmitted: true,
  exactKeysInOrder: true,
  honestFlagsEnforced: true,
  modelCalls: 0,
  remoteCalls: 0,
  activated: 0,
  learningPromoted: false,
  automaticRecovery: false,
  billionUsersProven: false,
  humanDecision: 'REQUIRED' as const,
});

const VERIFIED_KEYS = [
  'status', 'kind', 'policyVersion', 'memoryPacket', 'currentDigests', 'tenantId',
  'staleDocumentId', 'previousDigestHead', 'currentDigestHead', 'newDocumentId',
  'newTitle', 'newBodyText', 'newDigestSha256', 'chunkCount', 'storyIds', 'stories',
  'modelCalls', 'remoteCalls', 'activated', 'learningPromoted', 'stoppedBefore', 'humanDecision',
] as const;

const REFUSED_KEYS = [
  'status', 'kind', 'policyVersion', 'reason', 'modelCalls', 'remoteCalls',
  'activated', 'learningPromoted', 'humanDecision',
] as const;

const HEAD16_RE = /^[0-9a-f]{16}$/;
const SHA64_RE = /^[0-9a-f]{64}$/;

export type StaleReingestPlanViewModel =
  | Readonly<{
      kind: 'VERIFIED_STALE_REINGEST_PLAN';
      policyVersion: string;
      display: Readonly<{
        headline: string;
        tenantId: string;
        staleDocumentId: string;
        previousDigestHead: string;
        currentDigestHead: string;
        newDocumentId: string;
        newTitle: string;
        newDigestHead: string;
        chunkCount: number;
        storyIds: readonly string[];
        stoppedBefore: string;
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

const REFUSAL_HEADLINE = 'Stale re-ingestion plan refused — HUMAN DECISION REQUIRED';

function requireExactKeys(raw: Record<string, unknown>, keys: readonly string[]): void {
  const ks = Object.keys(raw);
  if (ks.length !== keys.length || !keys.every((k, i) => ks[i] === k))
    throw new Error(`a re-ingestion plan packet must have exactly the keys [${keys.join(', ')}] in order for its status; fail closed`);
}

export function buildStaleReingestPlanViewModel(raw: unknown): StaleReingestPlanViewModel {
  try {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: STALE_REINGEST_PLAN_VIEW_MODEL_POLICY.policyVersion,
        reason: 'the plan input is not an object; fail closed',
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'NO plan was rendered: the packet could not be verified.',
          operatorNote: 'Paste the REAL 12D-305 memory packet, the re-fetched digests, and the successor source.',
        }),
      });
    }
    const p = raw as Readonly<Record<string, unknown>>;
    if (p.status === 'VERIFIED') {
      requireExactKeys(p as Record<string, unknown>, VERIFIED_KEYS);
      if (p.kind !== 'STALE_REINGEST_PLAN')
        throw new Error('a VERIFIED plan must carry kind STALE_REINGEST_PLAN; fail closed');
      if (p.policyVersion !== STALE_REINGEST_PLAN_POLICY.policyVersion)
        throw new Error(`a VERIFIED plan must carry policyVersion ${STALE_REINGEST_PLAN_POLICY.policyVersion}; fail closed`);
      // THE ENTIRE PLAN IS RE-DERIVED from the packet's own inputs —
      // through ONLY real contracts.
      const memoryVm = buildAssistantMemoryViewModel(p.memoryPacket);
      if (memoryVm.kind === 'REFUSED')
        throw new Error(`the carried memory packet failed re-verification (${memoryVm.reason}); the plan is refused`);
      const staleness = prepareSourceStalenessCard({ memoryPacket: p.memoryPacket, currentDigests: p.currentDigests });
      if (staleness.status === 'REFUSED')
        throw new Error(`the staleness re-derivation refused (${staleness.reason}); the plan is refused`);
      const row = staleness.assessed.find((a) => a.documentId === p.staleDocumentId);
      if (row === undefined)
        throw new Error('the target document is not carried by the re-derived assessment; fail closed');
      if (row.verdict !== 'STALE')
        throw new Error(`the re-derived verdict for the target document is ${row.verdict}, not STALE; fail closed`);
      if (p.previousDigestHead !== row.recordedDigestHead || p.currentDigestHead !== row.currentDigestHead)
        throw new Error('the disclosed lineage does not match the re-derived digest heads; fail closed');
      if (staleness.assessed.some((a) => a.documentId === p.newDocumentId))
        throw new Error('the successor documentId collides with an assessed document; fail closed');
      if (typeof p.newTitle !== 'string' || typeof p.newBodyText !== 'string'
        || typeof p.newDocumentId !== 'string' || p.newDocumentId.length < 1)
        throw new Error('the successor source fields must be non-empty strings; fail closed');
      if (typeof p.newDigestSha256 !== 'string' || !SHA64_RE.test(p.newDigestSha256))
        throw new Error('newDigestSha256 must be lowercase hex64; fail closed');
      if (!HEAD16_RE.test(p.previousDigestHead) || !HEAD16_RE.test(p.currentDigestHead))
        throw new Error('the lineage digest heads must be hex16; fail closed');
      // The REAL 12D-274 ingest door re-derives digest, chunks, stories.
      let reDerived;
      try {
        reDerived = prepareDocumentStories({
          tenantId: staleness.tenantId,
          documentId: p.newDocumentId,
          title: p.newTitle,
          bodyText: p.newBodyText,
        });
      } catch (err) {
        throw new Error(`the REAL ingest door refused the re-derived successor (${err instanceof Error ? err.message : String(err)}); fail closed`);
      }
      if (reDerived.documentDigestSha256 !== p.newDigestSha256)
        throw new Error('the successor digest does not match the re-derived one; fail closed');
      if (reDerived.chunkCount !== p.chunkCount)
        throw new Error('the chunk count does not match the re-derived one; fail closed');
      if (JSON.stringify(p.stories) !== JSON.stringify(reDerived.stories))
        throw new Error('the carried stories do not match the re-derived stories; fail closed');
      const storyIds = p.storyIds;
      if (!Array.isArray(storyIds) || JSON.stringify(storyIds) !== JSON.stringify(reDerived.stories.map((s) => s.id)))
        throw new Error('storyIds do not match the re-derived story ids; fail closed');
      if (p.tenantId !== staleness.tenantId)
        throw new Error('the plan tenantId must match the memory packet tenant; fail closed');
      if (p.modelCalls !== 0 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the honest flags are pinned (modelCalls 0, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (typeof p.stoppedBefore !== 'string' || !p.stoppedBefore.includes('the operator submits through the real doors'))
        throw new Error('stoppedBefore must disclose that nothing is admitted here; fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED; fail closed');
      return Object.freeze({
        kind: 'VERIFIED_STALE_REINGEST_PLAN' as const,
        policyVersion: STALE_REINGEST_PLAN_VIEW_MODEL_POLICY.policyVersion,
        display: Object.freeze({
          headline: `Re-ingestion plan prepared — successor ${String(p.newDocumentId)} supersedes stale ${String(p.staleDocumentId)} (evidence ${String(p.previousDigestHead)} → ${p.newDigestSha256.slice(0, 16)}), ${reDerived.chunkCount} bounded chunk(s) ready for the REAL admission doors — nothing admitted here`,
          tenantId: staleness.tenantId,
          staleDocumentId: String(p.staleDocumentId),
          previousDigestHead: p.previousDigestHead,
          currentDigestHead: p.currentDigestHead,
          newDocumentId: String(p.newDocumentId),
          newTitle: String(p.newTitle),
          newDigestHead: p.newDigestSha256.slice(0, 16),
          chunkCount: reDerived.chunkCount,
          storyIds: Object.freeze(storyIds as string[]),
          stoppedBefore: p.stoppedBefore,
          operatorNote: `Re-verified against stale-reingest-plan policy ${STALE_REINGEST_PLAN_POLICY.policyVersion}: the memory packet was RE-VERIFIED through the REAL 12D-306 gate, the STALE assessment was RE-DERIVED through the REAL 12D-315 contract (a CURRENT or UNCHECKED source has nothing to re-ingest), and the successor digest, chunk count and every story were RE-DERIVED through the REAL 12D-274 ingest door — nothing is trusted. The lineage is disclosed in full (recorded head → successor head) so the evidence-version chain stays tamper-evident. This plan admits NOTHING: submit the emitted stories through the REAL 12D-275/12D-278 admission doors — the queue decides, the operator decides. No model ran (modelCalls 0, remoteCalls 0); no weights moved (learningPromoted false); humanDecision REQUIRED.`,
        }),
      });
    }
    if (p.status === 'REFUSED') {
      requireExactKeys(p as Record<string, unknown>, REFUSED_KEYS);
      if (p.kind !== 'STALE_REINGEST_PLAN')
        throw new Error('a REFUSED packet must carry kind STALE_REINGEST_PLAN; fail closed');
      if (p.policyVersion !== STALE_REINGEST_PLAN_POLICY.policyVersion)
        throw new Error(`a REFUSED packet must carry policyVersion ${STALE_REINGEST_PLAN_POLICY.policyVersion}; fail closed`);
      if (typeof p.reason !== 'string' || p.reason.length < 1)
        throw new Error('a REFUSED packet must carry a bounded reason; fail closed');
      if (p.modelCalls !== 0 || p.remoteCalls !== 0 || p.activated !== 0 || p.learningPromoted !== false)
        throw new Error('the honest flags are pinned (modelCalls 0, remoteCalls 0, activated 0, learningPromoted false); fail closed');
      if (p.humanDecision !== 'REQUIRED')
        throw new Error('humanDecision must be REQUIRED; fail closed');
      return Object.freeze({
        kind: 'REFUSED' as const,
        policyVersion: STALE_REINGEST_PLAN_VIEW_MODEL_POLICY.policyVersion,
        reason: p.reason,
        display: Object.freeze({
          headline: REFUSAL_HEADLINE,
          bodyText: 'NO plan was rendered: the packet could not be verified, and nothing from it is displayed.',
          operatorNote: 'Only an intact plan renders. Tampered plans render nothing.',
        }),
      });
    }
    throw new Error('a re-ingestion plan packet must carry status VERIFIED or REFUSED; fail closed');
  } catch (err) {
    return Object.freeze({
      kind: 'REFUSED' as const,
      policyVersion: STALE_REINGEST_PLAN_VIEW_MODEL_POLICY.policyVersion,
      reason: err instanceof Error ? err.message : String(err),
      display: Object.freeze({
        headline: REFUSAL_HEADLINE,
        bodyText: 'NO plan was rendered: the packet could not be verified.',
        operatorNote: 'Only an intact plan renders. Tampered plans render nothing.',
      }),
    });
  }
}