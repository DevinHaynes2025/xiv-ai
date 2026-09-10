/**
 * Founder Twin ethics gate for 12D-05 Universe Simulation Kernel.
 * Assertable constants — universes are SIMULATION layers only.
 */
import { PHYSICAL_PORTAL_CAPABILITY, PRODUCTION_DIMENSIONAL_FABRIC_ENABLED } from './fabric';
import { BUILDER_GUARDRAILS } from '../builder/policy';
import { DATABASE_CITY_GUARDRAILS as MULTI_CLOUD_GUARDRAILS } from '../databasecity/fabric';

/** Universes = SIMULATION layers only; never literal worlds. */
export const UNIVERSES_ARE_SIMULATION_LAYERS_ONLY = true as const;

/** Red-line: no physical portals language or capability. */
export const PHYSICAL_PORTALS_BANNED = true as const;

/** Red-line: never claim quantum advantage. */
export const QUANTUM_ADVANTAGE_CLAIM = false as const;

/** Red-line: no trillion-$ / valuation theater in contracts or UX copy. */
export const VALUATION_THEATER_ALLOWED = false as const;

/** Business bar: adoption / reliability / security / unit economics / customer value only. */
export const BUSINESS_BAR_METRICS = Object.freeze([
  'adoption',
  'reliability',
  'security',
  'unit_economics',
  'customer_value',
] as const);

export type BusinessBarMetric = (typeof BUSINESS_BAR_METRICS)[number];

/** High-autonomy surfaces: LOCAL | CLOUD_SANDBOX only. */
export const HIGH_AUTONOMY_TARGETS = Object.freeze(['LOCAL', 'CLOUD_SANDBOX'] as const);

export type HighAutonomyTarget = (typeof HIGH_AUTONOMY_TARGETS)[number];

export const UNIVERSE_KERNEL_GUARDRAILS = {
  UNIVERSES_ARE_SIMULATION_LAYERS_ONLY,
  PHYSICAL_PORTALS_BANNED,
  PHYSICAL_PORTAL_CAPABILITY,
  QUANTUM_ADVANTAGE_CLAIM,
  VALUATION_THEATER_ALLOWED,
  PRODUCTION_DIMENSIONAL_FABRIC_ENABLED,
  L4_PRODUCTION_ENABLED: false as const,
  autonomousProductionDDL: BUILDER_GUARDRAILS.autonomousProductionDDL,
  autonomousProductionDML: BUILDER_GUARDRAILS.autonomousProductionDML,
  autonomousDestructiveMigration: BUILDER_GUARDRAILS.autonomousDestructiveMigration,
  autonomousSecretCreation: BUILDER_GUARDRAILS.autonomousSecretCreation,
  autonomousDeployment: BUILDER_GUARDRAILS.autonomousDeployment,
  autonomousProductionReplication: MULTI_CLOUD_GUARDRAILS.autonomousProductionReplication,
  autonomousCrossTenantReplication: MULTI_CLOUD_GUARDRAILS.autonomousCrossTenantReplication,
  autonomousCloudCreation: MULTI_CLOUD_GUARDRAILS.autonomousCloudCreation,
  destructiveSchemaEvolution: MULTI_CLOUD_GUARDRAILS.destructiveSchemaEvolution,
  /** GCP+Azure = sim/sandbox routing only — not PRODUCTION deploy or live DDL. */
  cloudProvidersAreSandboxRoutingOnly: true as const,
  liveProductionDdlAllowed: false as const,
  literalGalaxiesClaim: false as const,
} as const;

const BANNED_PHRASE_PATTERNS: readonly RegExp[] = Object.freeze([
  /\bphysical\s+portal/i,
  /\bquantum\s+advantage\b/i,
  /\btrillion\s*[- ]?\$/i,
  /\bvaluation\s+theater\b/i,
  /\bliteral\s+galax(?:y|ies)\b/i,
  /\breal\s+world\s+portal\b/i,
]);

/**
 * Reject copy that violates Founder Twin red-lines.
 * Safe for docs/UX/prompt/comment review in tests.
 */
export function assertEthicsSafeCopy(text: string, context = 'copy'): void {
  if (!UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('UNIVERSES_ARE_SIMULATION_LAYERS_ONLY must remain true');
  }
  if (PHYSICAL_PORTAL_CAPABILITY) {
    throw new Error('PHYSICAL_PORTAL_CAPABILITY must remain false');
  }
  if (QUANTUM_ADVANTAGE_CLAIM) {
    throw new Error('QUANTUM_ADVANTAGE_CLAIM must remain false');
  }
  if (VALUATION_THEATER_ALLOWED) {
    throw new Error('VALUATION_THEATER_ALLOWED must remain false');
  }
  for (const pattern of BANNED_PHRASE_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error('ethics red-line in ' + context + ': matches ' + String(pattern));
    }
  }
}

export function assertUniverseKernelGuardrails(): void {
  if (!UNIVERSE_KERNEL_GUARDRAILS.UNIVERSES_ARE_SIMULATION_LAYERS_ONLY) {
    throw new Error('universes must remain simulation layers only');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.PHYSICAL_PORTAL_CAPABILITY) {
    throw new Error('physical portals must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.QUANTUM_ADVANTAGE_CLAIM) {
    throw new Error('quantum advantage claim must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.VALUATION_THEATER_ALLOWED) {
    throw new Error('valuation theater must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.PRODUCTION_DIMENSIONAL_FABRIC_ENABLED) {
    throw new Error('production dimensional fabric must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.L4_PRODUCTION_ENABLED) {
    throw new Error('L4 production must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionReplication) {
    throw new Error('autonomousProductionReplication must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.autonomousCrossTenantReplication) {
    throw new Error('autonomousCrossTenantReplication must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.autonomousCloudCreation) {
    throw new Error('autonomousCloudCreation must remain false');
  }
  if (UNIVERSE_KERNEL_GUARDRAILS.liveProductionDdlAllowed) {
    throw new Error('liveProductionDdlAllowed must remain false');
  }
  if (
    UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionDDL ||
    UNIVERSE_KERNEL_GUARDRAILS.autonomousProductionDML ||
    UNIVERSE_KERNEL_GUARDRAILS.autonomousDestructiveMigration ||
    UNIVERSE_KERNEL_GUARDRAILS.autonomousSecretCreation ||
    UNIVERSE_KERNEL_GUARDRAILS.autonomousDeployment
  ) {
    throw new Error('all autonomousProduction* flags must remain false');
  }
}

export function isHighAutonomyTarget(target: string): target is HighAutonomyTarget {
  return (HIGH_AUTONOMY_TARGETS as readonly string[]).includes(target);
}
