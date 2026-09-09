import { overLimitDimensions } from './budgets';
import type {
  CandidateEvaluation,
  EligibilityReason,
  Placement,
  ResourceBudget,
  ResourceUsage,
  RuntimeNodeRecord,
  TenantScope,
  VendorSupportState,
  WorkloadClassification,
  WorkloadRecord,
} from './types';
import { CLASSIFICATION_RANK, TIER_RANK, TRUST_RANK } from './types';
import { capabilitySatisfies, parseCapability } from './xhal';

/**
 * The runtime capability registry answer (story section 14): every candidate
 * gets a single, reportable reason. Agents see capability answers, never a
 * browsable inventory of machines.
 */

const ATTESTATION_RANK: Readonly<Record<string, number>> = Object.freeze({
  unknown: 0,
  revoked: 0,
  quarantined: 0,
  degraded: 1,
  registered: 2,
  verified: 3,
  attested: 4,
});

const TINY_COMPUTE_UNITS = 4;
const LOW_BATTERY_PERCENT = 25;

export function placementsFor(node: RuntimeNodeRecord): Placement[] {
  const placements = new Set<Placement>();
  switch (node.nodeType) {
    case 'mobile_phone':
    case 'tablet':
      placements.add('device');
      break;
    case 'laptop':
      placements.add('device');
      placements.add('edge');
      placements.add('cpu');
      break;
    case 'workstation':
      placements.add('edge');
      placements.add('cpu');
      break;
    case 'edge_gateway':
    case 'industrial_controller':
    case 'vehicle':
      placements.add('edge');
      break;
    case 'cloud_cpu':
      placements.add('cpu');
      break;
    case 'cloud_gpu':
      placements.add('cpu');
      placements.add('gpu');
      break;
    case 'data_center':
      placements.add('cpu');
      placements.add('gpu');
      break;
  }
  if (node.hardware.gpuVendor !== 'none' && node.hardware.gpuVendor !== 'unknown') placements.add('gpu');
  if (node.securityPolicy.tenancy === 'dedicated') placements.add('private');
  return [...placements];
}

function capabilityReason(
  node: RuntimeNodeRecord,
  requested: string,
): Extract<EligibilityReason, 'eligible' | 'capability_missing' | 'capability_tier_insufficient'> {
  if (node.capabilities.some((offered) => capabilitySatisfies(offered, requested))) return 'eligible';
  const want = parseCapability(requested);
  if (!want) return 'capability_missing';
  const sameFunction = node.capabilities
    .map(parseCapability)
    .filter((offered) => offered && offered.domain === want.domain && offered.fn === want.fn);
  if (sameFunction.length > 0 && sameFunction.every((offered) => TIER_RANK[offered!.tier] < TIER_RANK[want.tier])) {
    return 'capability_tier_insufficient';
  }
  return 'capability_missing';
}

export type EligibilityInput = {
  node: RuntimeNodeRecord;
  workload: WorkloadRecord;
  classification: WorkloadClassification;
  scope: TenantScope;
  laneSupport: VendorSupportState;
  budgetLimit: ResourceBudget;
  budgetUsed: ResourceUsage;
  charge: ResourceUsage;
};

function reject(nodeId: string, reason: EligibilityReason): CandidateEvaluation {
  return { nodeId, eligible: false, reason, placement: null, score: null };
}

export function evaluateCandidate(input: EligibilityInput): CandidateEvaluation {
  const { node, workload, classification, scope } = input;
  const nodeId = node.nodeId;

  if (node.lifecycle === 'revoked') return reject(nodeId, 'node_revoked');
  if (node.lifecycle === 'quarantined') return reject(nodeId, 'node_quarantined');
  if (node.lifecycle === 'paused') return reject(nodeId, 'node_paused');
  if (node.lifecycle === 'draining') return reject(nodeId, 'node_draining');

  if (node.organizationId !== scope.organizationId || node.universeId !== scope.universeId) {
    return reject(nodeId, 'tenant_mismatch');
  }

  const requiredAttestation = Math.max(
    ATTESTATION_RANK[node.securityPolicy.requiredAttestation] ?? 4,
    ATTESTATION_RANK[classification.securityFloor.minAttestation] ?? 4,
  );
  if ((ATTESTATION_RANK[node.attestationState] ?? 0) < requiredAttestation) {
    return reject(nodeId, 'attestation_insufficient');
  }

  if (TRUST_RANK[node.trustLevel] < TRUST_RANK[classification.securityFloor.minTrust]) {
    return reject(nodeId, 'insufficient_trust');
  }

  if (input.laneSupport !== 'proven') return reject(nodeId, 'vendor_unproven');

  if (CLASSIFICATION_RANK[workload.classification] > CLASSIFICATION_RANK[node.securityPolicy.maxClassification]) {
    return reject(nodeId, 'classification_exceeds_node_policy');
  }

  if (classification.securityFloor.requiresDedicatedTenancy && node.securityPolicy.tenancy !== 'dedicated') {
    return reject(nodeId, 'dedicated_tenancy_required');
  }

  if (workload.dataResidency.length > 0 && !workload.dataResidency.includes(node.region)) {
    return reject(nodeId, 'region_not_permitted');
  }

  if (!node.allowedWorkloads.includes(workload.kind)) return reject(nodeId, 'workload_kind_not_allowed');

  if (workload.consequential && !node.securityPolicy.allowConsequentialActions) {
    return reject(nodeId, 'consequential_not_permitted');
  }

  const capability = capabilityReason(node, workload.requestedCapability);
  if (capability !== 'eligible') return reject(nodeId, capability);

  if (node.healthState === 'unreachable') return reject(nodeId, 'node_unreachable');
  if (node.hardware.networkState === 'offline') return reject(nodeId, 'network_offline');
  if (node.hardware.memoryAvailableMb < workload.estimate.memoryMb) return reject(nodeId, 'memory_insufficient');

  const trivial = workload.estimate.computeUnits <= TINY_COMPUTE_UNITS;
  if (node.hardware.thermalState === 'critical' || (node.hardware.thermalState === 'elevated' && !trivial)) {
    return reject(nodeId, 'thermal_pressure');
  }

  const energy = node.hardware.energyState;
  if (
    energy.source === 'battery' &&
    !energy.charging &&
    (energy.batteryPercent ?? 100) < LOW_BATTERY_PERCENT &&
    !trivial
  ) {
    return reject(nodeId, 'energy_pressure');
  }

  if (overLimitDimensions(input.budgetLimit, input.budgetUsed, input.charge).length > 0) {
    return reject(nodeId, 'budget_exhausted');
  }

  const available = placementsFor(node);
  const placement = available.includes(classification.preferredPlacement)
    ? classification.preferredPlacement
    : available[0] ?? 'cpu';

  return { nodeId, eligible: true, reason: 'eligible', placement, score: null };
}
