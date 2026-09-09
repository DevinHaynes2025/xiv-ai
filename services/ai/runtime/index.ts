/**
 * XUR — XIV Universal Runtime, 2I-AI-62D architecture slice.
 *
 * DEPLOYMENT_STATE=QUEUED. Importing this module does not deploy a workload,
 * enroll a device, activate an agent, purchase compute, open a network
 * connection or touch a database. It is the executable model of the governed
 * runtime fabric described in story 2I-AI-62D.
 */

export {
  DEPLOYMENT_STATE,
  SECURITY_LOCK,
  TRANSPORT_TIERS,
  isAutonomyEnabled,
  isTransportTierReachable,
  type DeploymentState,
  type SecurityLockFlag,
  type TransportAvailability,
  type TransportTier,
} from './flags';

export {
  RuntimeFabric,
  createRuntimeFabric,
  signRuntimeProof,
  type AttestationMeasurements,
  type HeartbeatDirective,
  type ProofPurpose,
  type RegisterRuntimeInput,
  type RuntimeFabricOptions,
  type RuntimeProofClaim,
} from './control-plane';

export { authorize, authorizePermissionExpansion, hasPermission, sameScope } from './authz';

export {
  BUDGET_DIMENSIONS,
  addUsage,
  budgetKey,
  chargeForEstimate,
  defaultNodeBudget,
  overLimitDimensions,
  remaining,
  zeroUsage,
  type BudgetDimension,
} from './budgets';

export { classifyWorkload } from './classify';
export { evaluateCandidate, placementsFor, type EligibilityInput } from './eligibility';
export { estimateCost, estimateLatencyMs, rankCandidates, scoreFor, type RankedCandidate } from './economics';
export { runBoundedKernel, taskDigest, type KernelResult } from './kernels';
export {
  evaluateModel,
  mintModelBinding,
  selectModel,
  verifyModelBinding,
  type ModelBindingClaim,
  type ModelCandidate,
  type ModelRejection,
} from './models';
export {
  auditOfflineResults,
  boundGrant,
  packageBody,
  signOfflinePackage,
  verifyOfflinePackage,
  type GrantAudit,
  type OfflinePackageBody,
} from './offline';
export {
  capabilitySatisfies,
  createHardwareSupportMatrix,
  deriveCapabilities,
  laneIdFor,
  laneSupport,
  parseCapability,
  reconcileCapabilities,
  requiresAccelerator,
  sanitizeCapabilityReport,
} from './xhal';
export { canonicalJson, digest } from './crypto';

export * from './types';
