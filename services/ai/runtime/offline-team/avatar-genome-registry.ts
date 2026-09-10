export type AvatarGenomeDomain = 'IDENTITY' | 'BUSINESS' | 'TECHNICAL' | 'CREATIVE' | 'LEARNING' | 'SECURITY';

export interface AvatarGenomeStrand {
  strandId: string;
  domain: AvatarGenomeDomain;
  capabilityRefs: string[];
  preferenceRefs: string[];
  evidenceRefs: string[];
  version: number;
  confidence: number;
}

export interface AvatarGenome {
  avatarId: string;
  tenantId: string;
  userId: string;
  strands: AvatarGenomeStrand[];
  createdAt: string;
  updatedAt: string;
}

export function validateAvatarGenome(genome: AvatarGenome): true {
  if (!genome.avatarId || !genome.tenantId || !genome.userId) throw new Error('avatar identity required');
  const ids = new Set<string>();
  for (const strand of genome.strands) {
    if (ids.has(strand.strandId)) throw new Error('duplicate genome strand');
    ids.add(strand.strandId);
    if (strand.version < 1) throw new Error('strand version must be >= 1');
    if (strand.confidence < 0 || strand.confidence > 1) throw new Error('invalid confidence');
    if (!strand.evidenceRefs.length) throw new Error('genome strand evidence required');
  }
  return true;
}

export const AVATAR_GENOME_GUARDRAILS = {
  uniquePerAvatar: true,
  biologicalDnaClaimAllowed: false,
  silentModelWeightMutationAllowed: false,
  provenanceRequired: true,
  userRevocationSupported: true,
};
