import { evaluateAuthenticatedAlignment, type AlignmentTrustContext, type SignedAlignmentReceipt } from './alignment-receipt';
import { ECOSYSTEM_ALIGNMENT_PROTOCOL, ECOSYSTEM_TARGETS, defaultEcosystemAlignment, ecosystemLayerFor, type AlignmentDecision, type EcosystemTarget } from './ecosystem-alignment';

export type AuthenticatedAlignmentEvidence = { context: AlignmentTrustContext; receipt: SignedAlignmentReceipt };
export type AlignmentReportTrustHealth={reconciliationState:'VERIFIED'|'FRESH_CHECKPOINT_REQUIRED'|'REVIEW_REQUIRED'|'QUARANTINED';alignmentEvidenceUsable:boolean};

export function buildAuthenticatedAlignmentReport(evidence: readonly AuthenticatedAlignmentEvidence[],trustHealth?:AlignmentReportTrustHealth) {
  const counts = new Map<EcosystemTarget, number>();
  for (const item of evidence) counts.set(item.context.target, (counts.get(item.context.target) ?? 0) + 1);
  const decisions = new Map<EcosystemTarget, AlignmentDecision>();
  for (const item of evidence) {
    if (counts.get(item.context.target) !== 1) {
      decisions.set(item.context.target, { ...defaultEcosystemAlignment(item.context.target), reason: 'duplicate_target_evidence' });
      continue;
    }
    decisions.set(item.context.target, evaluateAuthenticatedAlignment(item.context, item.receipt));
  }
  const targets = ECOSYSTEM_TARGETS.map((target) => {
    const decision = decisions.get(target) ?? defaultEcosystemAlignment(target);
    return { target, layer: ecosystemLayerFor(target), state: decision.state, reason: decision.reason, compatibilityTarget: true as const, partnershipClaimed: false as const, productionLive: false as const, installedOnDevices: false as const, grantsAuthority: false as const };
  });
  const configuredCount = targets.filter((item) => item.state === 'CONFIGURED').length;
  const verified=trustHealth?.reconciliationState==='VERIFIED'&&trustHealth.alignmentEvidenceUsable===true,quarantined=trustHealth?.reconciliationState==='QUARANTINED',advanced=trustHealth?.reconciliationState==='FRESH_CHECKPOINT_REQUIRED';
  return { protocol: ECOSYSTEM_ALIGNMENT_PROTOCOL, targets, summary: { targetCount: targets.length, configuredCount, productionLiveCount: 0 as const, partnershipCount: 0 as const, universallyInstalled: false as const }, assurance:{receiptTrust:'SIGNED_RECEIPTS_ONLY' as const,trustStore:(quarantined?'QUARANTINED':trustHealth?'LOCAL_REFERENCE':'NOT_CONFIGURED') as 'QUARANTINED'|'LOCAL_REFERENCE'|'NOT_CONFIGURED',auditChain:(verified?'VERIFIED_CHECKPOINT':quarantined?'INVALID':advanced?'FRESH_CHECKPOINT_REQUIRED':'NOT_CONNECTED') as 'VERIFIED_CHECKPOINT'|'INVALID'|'FRESH_CHECKPOINT_REQUIRED'|'NOT_CONNECTED',alignmentEvidenceUsable:verified,independentReview:'REQUIRED' as const,productionActivation:'DISABLED' as const,publicDetail:'AGGREGATES_ONLY' as const} };
}
