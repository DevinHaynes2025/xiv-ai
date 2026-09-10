export type OperatingDomain = 'PRODUCT' | 'ENGINEERING' | 'FINANCE' | 'SECURITY' | 'OPERATIONS' | 'COMMUNITY' | 'CONSULTING';
export interface CooWorkPacket { packetId: string; domain: OperatingDomain; objective: string; evidenceRefs: readonly string[]; requiresHumanApproval: boolean; }
export const VIRTUAL_COO_GUARDRAILS = { productionMutationAllowed:false, financialTransactionAllowed:false, contractSignatureAllowed:false, maxParallelPackets:12 } as const;
export function prioritizeCooPackets(packets: readonly CooWorkPacket[]): readonly CooWorkPacket[] {
  return Object.freeze([...packets]
    .filter((p) => p.packetId && p.objective.trim() && p.evidenceRefs.length > 0)
    .slice(0, VIRTUAL_COO_GUARDRAILS.maxParallelPackets));
}
