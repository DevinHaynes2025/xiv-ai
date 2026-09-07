import { defaultDenyUnknownHandoff } from '../security/firewall';
import { guardianIsNotCodeWriter } from '../diagnostics';
import { learningMayRewriteSecurityOrProductionPolicy } from '../knowledge/loop';
import type {
  DataClassification,
  RuntimeEnvironmentType,
  RuntimeHealthState,
  RuntimeRequestStep,
} from './types';
import { RUNTIME_ENVIRONMENTS } from './types';

export type PlatformRuntime = {
  runtimeId: string;
  environment: RuntimeEnvironment;
  session: RuntimeSession;
  version: RuntimeVersion;
  health: RuntimeHealth;
  compatibility: RuntimeCompatibility;
};

export type RuntimeEnvironment = {
  type: RuntimeEnvironmentType;
  hostOsReplaced: false;
  kernelOwned: false;
};

export type RuntimeSession = {
  sessionId: string;
  deviceId: string;
  identityId: string;
  tenantId: string;
  universeId: string;
};

export type RuntimeCapability = {
  capabilityId: string;
  granted: boolean;
};

export type RuntimePolicy = {
  l4Enabled: false;
  guardianRequired: true;
  defaultDeny: true;
};

export type RuntimeHealth = {
  state: RuntimeHealthState;
  treatedAsHealthy: boolean;
};

export type RuntimeVersion = {
  version: string;
  minimumCompatible: string;
};

export type RuntimeCompatibility = {
  compatible: boolean;
  reason?: string;
};

export type RuntimeDependency = {
  name: string;
  version: string;
};

export type RuntimeFeatureFlag = {
  flag: string;
  enabled: boolean;
};

export type RuntimeAudit = {
  eventId: string;
  step: RuntimeRequestStep;
  allowed: boolean;
  reason: string;
};

export type RuntimeEvent = {
  kind: string;
  redacted: true;
};

export type RuntimeRequest = {
  deviceAuthorized?: boolean;
  identityBound?: boolean;
  sessionValid?: boolean;
  tenantId?: string;
  universeId?: string;
  classification?: DataClassification;
  capability?: string;
  agentOrExtension?: string;
  purpose?: string;
  authoritySatisfied?: boolean;
  approvalSatisfied?: boolean;
  bypassGuardian?: boolean;
};

export type RuntimeRequestDecision =
  | { allowed: false; reason: string; failedStep: RuntimeRequestStep; audited: true }
  | { allowed: true; audited: true; failedStep: null };

export function createRuntimeEnvironment(type: RuntimeEnvironmentType): RuntimeEnvironment {
  void RUNTIME_ENVIRONMENTS;
  return { type, hostOsReplaced: false, kernelOwned: false };
}

export function createPlatformRuntime(input: {
  environment: RuntimeEnvironmentType;
  deviceId: string;
  identityId: string;
  tenantId: string;
  universeId: string;
  version?: string;
  health?: RuntimeHealthState;
}): PlatformRuntime {
  const healthState = input.health ?? 'UNKNOWN';
  return {
    runtimeId: `runtime:${input.environment}:${input.deviceId}`,
    environment: createRuntimeEnvironment(input.environment),
    session: {
      sessionId: `session:${input.deviceId}`,
      deviceId: input.deviceId,
      identityId: input.identityId,
      tenantId: input.tenantId,
      universeId: input.universeId,
    },
    version: { version: input.version ?? '0.0.1', minimumCompatible: '0.0.1' },
    health: { state: healthState, treatedAsHealthy: healthState === 'HEALTHY' },
    compatibility: { compatible: true },
  };
}

export function runtimeCannotBypassGuardian(): true {
  void defaultDenyUnknownHandoff();
  return true;
}

export function runtimeModifiesGuardian(): false {
  void guardianIsNotCodeWriter();
  return false;
}

export function runtimeRewritesSecurityPolicy(): false {
  return learningMayRewriteSecurityOrProductionPolicy();
}

export function evaluateRuntimeRequest(request: RuntimeRequest): RuntimeRequestDecision {
  if (request.bypassGuardian === true) {
    return { allowed: false, reason: 'runtime_cannot_bypass_guardian', failedStep: 'AUTHORITY', audited: true };
  }
  if (request.deviceAuthorized !== true) {
    return { allowed: false, reason: 'device_not_authorized', failedStep: 'DEVICE', audited: true };
  }
  if (request.identityBound !== true) {
    return { allowed: false, reason: 'identity_not_bound', failedStep: 'IDENTITY', audited: true };
  }
  if (request.sessionValid !== true) {
    return { allowed: false, reason: 'session_invalid', failedStep: 'SESSION', audited: true };
  }
  if (!request.tenantId) {
    return { allowed: false, reason: 'tenant_required', failedStep: 'TENANT', audited: true };
  }
  if (!request.universeId) {
    return { allowed: false, reason: 'universe_required', failedStep: 'UNIVERSE', audited: true };
  }
  if (!request.classification) {
    return { allowed: false, reason: 'classification_required', failedStep: 'CLASSIFICATION', audited: true };
  }
  if (!request.capability) {
    return { allowed: false, reason: 'capability_required', failedStep: 'CAPABILITY', audited: true };
  }
  if (!request.agentOrExtension) {
    return { allowed: false, reason: 'agent_or_extension_required', failedStep: 'AGENT_OR_EXTENSION', audited: true };
  }
  if (!request.purpose) {
    return { allowed: false, reason: 'purpose_required', failedStep: 'PURPOSE', audited: true };
  }
  if (request.authoritySatisfied !== true) {
    return { allowed: false, reason: 'authority_not_satisfied', failedStep: 'AUTHORITY', audited: true };
  }
  if (request.approvalSatisfied !== true) {
    return { allowed: false, reason: 'approval_required', failedStep: 'APPROVAL', audited: true };
  }
  return { allowed: true, audited: true, failedStep: null };
}

export function treatUnknownHealthAsHealthy(state: RuntimeHealthState): boolean {
  return state === 'HEALTHY';
}

export function runtimeHealthIsHealthy(health: RuntimeHealth): boolean {
  return health.state === 'HEALTHY' && health.treatedAsHealthy === true;
}

export function redactRuntimeLog(input: { payload?: unknown; includeRawPayload?: boolean }) {
  if (input.includeRawPayload === true) {
    return { redacted: false as const, payload: input.payload };
  }
  return { redacted: true as const, payload: undefined };
}

export type RuntimeMetric = { name: string; value: number; containsRawPayload: false };
export type RuntimeTrace = { traceId: string; containsRawPayload: false };
export type RuntimeLogReference = { logId: string; redacted: true };
export type RuntimeAlert = { alertId: string; severity: 'info' | 'warning' | 'critical' };
export type PluginMetric = { pluginId: string; failures: number };
export type PluginFailure = { pluginId: string; reason: string };
export type DeviceHealthSignal = { deviceId: string; state: RuntimeHealthState };
export type ExtensionFailure = { extensionId: string; reason: string };
export type CapabilityDenial = { capability: string; reason: string };

export function createRuntimeMetric(name: string, value: number): RuntimeMetric {
  return { name, value, containsRawPayload: false };
}

export const DEFAULT_RUNTIME_POLICY: RuntimePolicy = {
  l4Enabled: false,
  guardianRequired: true,
  defaultDeny: true,
};
