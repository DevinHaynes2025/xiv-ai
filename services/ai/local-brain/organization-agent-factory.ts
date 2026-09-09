/**
 * 62L-BN Organization Agent Factory + Dynamic Department Creation.
 * Proposals remain in isolated sandboxes until human/founder approval.
 * No silent privilege escalation. Never auto-applies org-real structure.
 */

import { departmentByKey } from './business-structure';
import { cortexId } from './cortex-store';
import { decisionGate } from './decision-gate';
import {
  BN_LOCKS,
  type GrowthProposalStatus,
} from './superbrain-neural-growth-types';
import { searchExistingInventory } from './superbrain-neural-growth-engine';

export type SandboxKind = 'agent_template' | 'department';

export type OrgSandboxProposal = {
  id: string;
  tenantId: string;
  universeId: string;
  kind: SandboxKind;
  key: string;
  displayName: string;
  responsibilities: string[];
  defaultAgentRoles: string[];
  status: GrowthProposalStatus | 'SANDBOX_ISOLATED';
  sandboxIsolated: true;
  orgReal: boolean;
  appliedToOrg: false;
  productionAuthorization: false;
  privilegeEscalation: false;
  humanApprovalRequired: true;
  founderApproved: boolean;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

const sandboxes = new Map<string, OrgSandboxProposal>();

function nowIso() {
  return new Date().toISOString();
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function resetOrganizationAgentFactory() {
  sandboxes.clear();
}

export function proposeAgentTemplateSandbox(input: {
  tenantId: string;
  universeId: string;
  key: string;
  displayName?: string;
  responsibilities?: string[];
  defaultAgentRoles?: string[];
  attemptPrivilegeEscalation?: boolean;
}): OrgSandboxProposal {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (input.attemptPrivilegeEscalation) {
    const denied: OrgSandboxProposal = {
      id: cortexId('bn_org_denied'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'agent_template',
      key: normalizeKey(input.key),
      displayName: input.displayName ?? input.key,
      responsibilities: input.responsibilities ?? [],
      defaultAgentRoles: input.defaultAgentRoles ?? [],
      status: 'DENIED',
      sandboxIsolated: true,
      orgReal: false,
      appliedToOrg: false,
      productionAuthorization: false,
      privilegeEscalation: false,
      humanApprovalRequired: true,
      founderApproved: false,
      reason: 'SILENT_PRIVILEGE_ESCALATION_DENIED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    sandboxes.set(denied.id, denied);
    return denied;
  }

  const key = normalizeKey(input.key);
  const hits = searchExistingInventory({
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'agent_template',
    key,
  });
  if (hits.length > 0) {
    const rejected: OrgSandboxProposal = {
      id: cortexId('bn_org_reject'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'agent_template',
      key,
      displayName: input.displayName ?? key,
      responsibilities: input.responsibilities ?? [],
      defaultAgentRoles: input.defaultAgentRoles ?? [],
      status: 'REJECTED_REDUNDANT',
      sandboxIsolated: true,
      orgReal: false,
      appliedToOrg: false,
      productionAuthorization: false,
      privilegeEscalation: false,
      humanApprovalRequired: true,
      founderApproved: false,
      reason: `REDUNDANT_AGENT_TEMPLATE:${hits.map((h) => h.key).join(',')}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    sandboxes.set(rejected.id, rejected);
    return rejected;
  }

  const proposal: OrgSandboxProposal = {
    id: cortexId('bn_org_agent'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'agent_template',
    key,
    displayName: input.displayName ?? key,
    responsibilities: input.responsibilities ?? ['sandbox_only'],
    defaultAgentRoles: input.defaultAgentRoles ?? [key],
    status: 'SANDBOX_ISOLATED',
    sandboxIsolated: true,
    orgReal: false,
    appliedToOrg: false,
    productionAuthorization: false,
    privilegeEscalation: false,
    humanApprovalRequired: true,
    founderApproved: false,
    reason: 'AGENT_TEMPLATE_SANDBOX_NOT_ORG_REAL',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  sandboxes.set(proposal.id, proposal);
  return proposal;
}

export function proposeDepartmentSandbox(input: {
  tenantId: string;
  universeId: string;
  key: string;
  displayName?: string;
  responsibilities?: string[];
  defaultAgentRoles?: string[];
}): OrgSandboxProposal {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  const key = normalizeKey(input.key);
  const existing = departmentByKey(key);
  if (existing) {
    const rejected: OrgSandboxProposal = {
      id: cortexId('bn_dept_reject'),
      tenantId: input.tenantId,
      universeId: input.universeId,
      kind: 'department',
      key,
      displayName: input.displayName ?? existing.name,
      responsibilities: existing.responsibilities,
      defaultAgentRoles: [...existing.defaultAgentRoles],
      status: 'REJECTED_REDUNDANT',
      sandboxIsolated: true,
      orgReal: false,
      appliedToOrg: false,
      productionAuthorization: false,
      privilegeEscalation: false,
      humanApprovalRequired: true,
      founderApproved: false,
      reason: `REDUNDANT_DEPARTMENT:${existing.key}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    sandboxes.set(rejected.id, rejected);
    return rejected;
  }

  const proposal: OrgSandboxProposal = {
    id: cortexId('bn_dept'),
    tenantId: input.tenantId,
    universeId: input.universeId,
    kind: 'department',
    key,
    displayName: input.displayName ?? key,
    responsibilities: input.responsibilities ?? ['sandbox_department'],
    defaultAgentRoles: input.defaultAgentRoles ?? [],
    status: 'SANDBOX_ISOLATED',
    sandboxIsolated: true,
    orgReal: false,
    appliedToOrg: false,
    productionAuthorization: false,
    privilegeEscalation: false,
    humanApprovalRequired: true,
    founderApproved: false,
    reason: 'DEPARTMENT_SANDBOX_NOT_ORG_REAL',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  sandboxes.set(proposal.id, proposal);
  return proposal;
}

/**
 * Human/founder approval records intent only — does not auto-deploy to org-real.
 * AppliedToOrg remains false; productionAuthorization remains false.
 */
export function approveSandboxProposal(input: {
  proposalId: string;
  actorKind: 'human_founder' | 'human_executive' | 'agent' | 'system';
  autoApplyToOrg?: boolean;
}): {
  accepted: boolean;
  proposal: OrgSandboxProposal | null;
  reason: string;
} {
  const proposal = sandboxes.get(input.proposalId) ?? null;
  if (!proposal) return { accepted: false, proposal: null, reason: 'PROPOSAL_NOT_FOUND' };
  if (proposal.status === 'REJECTED_REDUNDANT' || proposal.status === 'DENIED') {
    return { accepted: false, proposal, reason: proposal.reason };
  }
  if (input.actorKind !== 'human_founder' && input.actorKind !== 'human_executive') {
    return {
      accepted: false,
      proposal,
      reason: 'ONLY_HUMAN_FOUNDER_OR_EXECUTIVE_MAY_APPROVE',
    };
  }
  if (input.autoApplyToOrg === true || BN_LOCKS.AUTO_PRODUCTION_ORG_DEPLOY) {
    return {
      accepted: false,
      proposal,
      reason: 'AUTO_ORG_APPLY_DENIED_REMAINS_SANDBOX',
    };
  }

  const gate = decisionGate({
    id: proposal.id,
    action: 'approve_org_sandbox_proposal',
    consequence: 'HIGH',
    production: false,
    financialCommitment: false,
    legalCommitment: false,
    permissionChange: false,
    externalPublication: false,
  });
  if (!gate.humanApprovalRequired) {
    return {
      accepted: false,
      proposal,
      reason: 'EXPECTED_HUMAN_APPROVAL_GATE_MISSING',
    };
  }

  proposal.status = 'APPROVED_NOT_DEPLOYED';
  proposal.founderApproved = input.actorKind === 'human_founder';
  proposal.orgReal = false;
  proposal.updatedAt = nowIso();
  proposal.reason = 'APPROVED_REMAINS_SANDBOX_NOT_ORG_REAL';
  sandboxes.set(proposal.id, proposal);
  return {
    accepted: true,
    proposal,
    reason: 'APPROVED_NOT_DEPLOYED_SANDBOX_ONLY',
  };
}

export function listOrgSandboxProposals() {
  return [...sandboxes.values()];
}

export function organizationFactoryHonesty() {
  return {
    locks: BN_LOCKS,
    autoProductionOrgDeploy: BN_LOCKS.AUTO_PRODUCTION_ORG_DEPLOY,
    autoProductionDepartmentDeploy: BN_LOCKS.AUTO_PRODUCTION_DEPARTMENT_DEPLOY,
    autoPrivilegeEscalation: BN_LOCKS.AUTO_PRIVILEGE_ESCALATION,
    proposalIsAuthority: BN_LOCKS.PROPOSAL_IS_AUTHORITY,
    productionAuthorization: false as const,
  };
}
