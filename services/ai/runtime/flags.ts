/**
 * 2I-AI-62D security lock (story section 32).
 *
 * These constants are the ground truth for the whole runtime fabric. Nothing in
 * `services/ai/runtime` performs network I/O, enrolls a device, provisions
 * compute or mutates production. The fabric is an in-memory control-plane model
 * used to prove the governance invariants before any deployment story runs.
 */

export type DeploymentState = 'QUEUED' | 'STAGED' | 'CANARY' | 'ACTIVE';

export const DEPLOYMENT_STATE: DeploymentState = 'QUEUED';

export const SECURITY_LOCK = Object.freeze({
  L4_AUTONOMY_ENABLED: false,
  AUTO_DEPLOY: false,
  AUTO_SCALE_AUTHORITY: false,
  AUTO_PERMISSION_EXPANSION: false,
  AUTO_SATELLITE_ACCESS: false,
  AUTO_EXTERNAL_ACCOUNT_CREATION: false,
  AUTO_PRODUCTION_MUTATION: false,
});

export type SecurityLockFlag = keyof typeof SECURITY_LOCK;

export function isAutonomyEnabled(flag: SecurityLockFlag): boolean {
  return SECURITY_LOCK[flag];
}

/**
 * Story section 31. The terrestrial tiers are architected here; the orbital
 * tiers stay unconfigured until a separate authorization story integrates and
 * validates a provider.
 */
export type TransportTier =
  | 'device'
  | 'edge'
  | 'cloud'
  | 'data_center'
  | 'terrestrial_network'
  | 'satellite_gateway'
  | 'orbital_node';

export type TransportAvailability = 'architected' | 'unconfigured';

export const TRANSPORT_TIERS: Readonly<Record<TransportTier, TransportAvailability>> = Object.freeze({
  device: 'architected',
  edge: 'architected',
  cloud: 'architected',
  data_center: 'architected',
  terrestrial_network: 'architected',
  satellite_gateway: 'unconfigured',
  orbital_node: 'unconfigured',
});

export function isTransportTierReachable(tier: TransportTier): boolean {
  if (tier === 'satellite_gateway' || tier === 'orbital_node') {
    return SECURITY_LOCK.AUTO_SATELLITE_ACCESS && TRANSPORT_TIERS[tier] === 'architected';
  }
  return TRANSPORT_TIERS[tier] === 'architected';
}
