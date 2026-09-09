/**
 * In-memory first-party module registry. Cloud-provisioned config only.
 * Does not execute downloaded JavaScript.
 */
import { nowIso } from '../actions';
import type { BusinessModuleAuditEvent, BusinessModuleManifest } from './os-types';
import { evaluateModulePolicy, moduleExecutesDownloadedJavascript } from './policy';
import type { ModulePolicyInput } from './policy';

const manifests = new Map<string, BusinessModuleManifest>();
const audit: BusinessModuleAuditEvent[] = [];

function auditEvent(
  packageId: string,
  action: BusinessModuleAuditEvent['action'],
  reason: string,
): BusinessModuleAuditEvent {
  const event = {
    eventId: `mod_${audit.length + 1}`,
    packageId,
    actorUserId: null,
    action,
    reason,
    createdAt: nowIso(),
  };
  audit.push(event);
  return event;
}

export function registerBusinessModule(manifest: BusinessModuleManifest) {
  const policy = evaluateModulePolicy({
    actorOrganizationId: 'registry',
    requestedOrganizationId: 'registry',
    requestedPermissions: [...manifest.requiredPermissions, ...manifest.optionalPermissions],
    thirdParty: manifest.publisherId !== 'xiv.first-party',
  });
  if (!policy.allowed) {
    auditEvent(manifest.packageId, 'deny', policy.reason);
    return { allowed: false as const, reason: policy.reason };
  }
  manifests.set(manifest.packageId, manifest);
  auditEvent(manifest.packageId, 'register', 'First-party manifest registered. Not installed.');
  return { allowed: true as const, packageId: manifest.packageId };
}

export function getBusinessModule(packageId: string) {
  return manifests.get(packageId) ?? null;
}

export function listBusinessModules() {
  return [...manifests.values()];
}

export function evaluateInstallRequest(input: ModulePolicyInput & { packageId: string }) {
  const manifest = manifests.get(input.packageId);
  if (!manifest) {
    return { allowed: false as const, reason: 'Unknown module package. Default deny.' };
  }
  const decision = evaluateModulePolicy(input);
  auditEvent(input.packageId, decision.allowed ? 'evaluate' : 'deny', decision.reason);
  return decision;
}

export function moduleRegistryRuntime() {
  return {
    executesDownloadedJavascript: moduleExecutesDownloadedJavascript(),
    marketplacePersisted: false,
    provisioned: 'cloud_side_config' as const,
    phoneReceives: ['authorized_experience', 'configuration'] as const,
  };
}

export function moduleAuditEvents() {
  return [...audit];
}

export function resetModuleRegistryForTests() {
  manifests.clear();
  audit.length = 0;
}

export function seedFirstPartyBusinessPacks(manifestsToSeed: readonly BusinessModuleManifest[]) {
  for (const manifest of manifestsToSeed) {
    if (!manifests.has(manifest.packageId)) {
      registerBusinessModule(manifest);
    }
  }
  return manifestsToSeed.map((manifest) => manifest.packageId);
}
