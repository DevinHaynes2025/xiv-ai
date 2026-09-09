import { KNOWLEDGE_DOMAINS, type KnowledgeDomain } from './knowledge-domains';

export type PhysicsDomainId =
  | 'fundamental_physics'
  | 'particle_physics'
  | 'cosmology'
  | 'dark_matter_research'
  | 'dark_energy_research'
  | 'quantum_foundations'
  | 'planetary_science'
  | 'galactic_structure_research';

export type PhysicsDomain = KnowledgeDomain & {
  id: PhysicsDomainId;
  usableAsCompute: false;
  usableAsNetwork: false;
  usableAsProductionInfrastructure: false;
};

export const FUNDAMENTAL_PHYSICS_DOMAINS: PhysicsDomain[] = [
  ['fundamental_physics', 'Fundamental Physics (research knowledge domain)'],
  ['particle_physics', 'Particle Physics (research knowledge domain)'],
  ['cosmology', 'Cosmology (research knowledge domain)'],
  ['dark_matter_research', 'Dark Matter — research domain only, not compute or network infrastructure'],
  ['dark_energy_research', 'Dark Energy — research domain only, not compute or network infrastructure'],
  ['quantum_foundations', 'Quantum Foundations (bounded research, not production magic)'],
  ['planetary_science', 'Planetary Science (models and sourced claims)'],
  ['galactic_structure_research', 'Galactic Structure — simulation/research only'],
].map(([id, label]) => ({
  id: id as PhysicsDomainId,
  label,
  defaultClassification: 'internal',
  requiresProvenance: true as const,
  notes:
    id === 'dark_matter_research' || id === 'dark_energy_research'
      ? 'Research domain only. Dark matter / dark energy are not usable XIV compute, storage, or network infrastructure unless future evidence separately supports that — and even then only after explicit human authorization.'
      : id === 'galactic_structure_research'
        ? 'Galactic infrastructure is simulation/research only. XIV does not operate or claim a real galactic network.'
        : 'Domain registration does not imply that data is present, licensed, verified, complete, or safe for every use.',
  usableAsCompute: false,
  usableAsNetwork: false,
  usableAsProductionInfrastructure: false,
}));

export const PHYSICS_HONESTY = Object.freeze({
  darkMatterUsableAsCompute: false as const,
  darkEnergyUsableAsCompute: false as const,
  darkMatterUsableAsNetwork: false as const,
  darkEnergyUsableAsNetwork: false as const,
  galacticInfrastructureReal: false as const,
  claimsConsciousness: false as const,
  quantumAdvantageClaimed: false as const,
});

export function physicsDomainById(id: string) {
  return FUNDAMENTAL_PHYSICS_DOMAINS.find((domain) => domain.id === id);
}

export function composedKnowledgeDomains(): KnowledgeDomain[] {
  return [...KNOWLEDGE_DOMAINS, ...FUNDAMENTAL_PHYSICS_DOMAINS];
}

export function assertPhysicsNotInfrastructure(id: string) {
  const domain = physicsDomainById(id);
  if (!domain) return { ok: true as const, usableAsCompute: false as const, usableAsNetwork: false as const };
  return {
    ok: true as const,
    usableAsCompute: domain.usableAsCompute,
    usableAsNetwork: domain.usableAsNetwork,
    usableAsProductionInfrastructure: domain.usableAsProductionInfrastructure,
  };
}
