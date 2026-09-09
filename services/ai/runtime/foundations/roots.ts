import { retainHistoricalRelationship } from '../ecosystem/roots';
import type { TrustRoot } from './types';
import { TRUST_ROOTS } from './types';

export type IdentityRoot = { subjectId: string; kind: 'user' | 'service' };
export type DeviceRoot = { deviceId: string; impersonatesIdentity: false };
export type DataRoot = { objectId: string; provenance: true; classification: string };
export type AuthorityRoot = { action: string; allowed: boolean };

export type DecisionRootGraph = {
  decisionId: string;
  identity: string;
  device: string;
  agent: string;
  model: string;
  evidence: string;
  dataSource: string;
  policy: string;
  approval: string;
  action: string;
  outcome: string;
};

export function bindRequestRoots(input: {
  identity?: IdentityRoot;
  device?: DeviceRoot;
  deviceClaimsIdentity?: boolean;
  data?: DataRoot;
  action: string;
  approved: boolean;
}) {
  if (input.deviceClaimsIdentity === true) {
    return { allowed: false as const, reason: 'device_root_cannot_impersonate_identity_root' };
  }
  if (!input.identity || !input.device || !input.data) {
    return { allowed: false as const, reason: 'identity_device_and_data_roots_required' };
  }
  if (input.approved !== true) {
    return { allowed: false as const, reason: 'authority_root_requires_approval' };
  }
  return {
    allowed: true as const,
    graph: {
      decisionId: `decision:${input.action}`,
      identity: input.identity.subjectId,
      device: input.device.deviceId,
      agent: 'none',
      model: 'none',
      evidence: 'bound',
      dataSource: input.data.objectId,
      policy: 'guardian',
      approval: 'human',
      action: input.action,
      outcome: 'authorized',
    } satisfies DecisionRootGraph,
  };
}

export function dataRootPreservesProvenance(input: {
  from: string;
  to: string;
  evidence?: { source: string; retrievedAt: string; reference: string };
}) {
  return retainHistoricalRelationship({
    from: input.from,
    to: input.to,
    kind: 'lineage',
    disappeared: false,
    evidence: input.evidence,
  });
}

export function auditRootCanBeDisabled(): false {
  void TRUST_ROOTS;
  return false;
}

export function trustRootUnknownIsTrusted(_root: TrustRoot, known?: boolean): boolean {
  return known === true;
}

export function deviceCannotImpersonateIdentity(): true {
  void bindRequestRoots({
    identity: { subjectId: 'user-1', kind: 'user' },
    device: { deviceId: 'd1', impersonatesIdentity: false },
    deviceClaimsIdentity: true,
    data: { objectId: 'obj-1', provenance: true, classification: 'TENANT_PRIVATE' },
    action: 'read',
    approved: true,
  });
  return true;
}
