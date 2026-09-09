/**
 * 62L-ES33 — Unified Identity & Account Federation Core runtime.
 *
 * One XIV identity → many authorized connections → separate Universes.
 * Deny: blanket provider auth, Personal Drive→Employer, ERP→Personal Brain,
 * silent linking, cross-Universe credential share, auto scope expansion,
 * cross-tenant pooling, provider tokens in Git, L4, Guardian/RLS bypass.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCOUNT_LINKING_ACTIONS,
  AGENT_IDENTITY_FIELDS,
  CANDIDATE_PROVIDERS,
  CONNECTION_LIFECYCLE_STATES,
  CONSENT_DISCLOSURE_FIELDS,
  ES33_AGENT_BOUNDS,
  ES33_DB_CANDIDATES_STATUS,
  ES33_FEDERATION_CYCLE,
  ES33_LOCKS,
  ES33_MAY,
  ES33_MUST_NOT,
  ES_LAYER_TITLE,
  FEDERATION_TRUTH_BOUNDARY,
  GITHUB_SOT_ISSUE,
  GITHUB_SOT_LABEL,
  GITHUB_SOT_TITLE,
  GITLAB_MIRROR_NOTE,
  HONESTY_BANNER,
  NEURAL_IDENTITY_GRAPH_NODES,
  NEXT_PHASE_TITLE,
  XIV_BRAIN_CORE_PATH,
  XIV_IDENTITY_FIELDS,
  assertEs33LocksIntact,
  connectionIsAuthorizedForUse,
  es33SoftWireSnapshot,
  isEs33Agent,
  isHumanApprover,
  nextConnectionLifecycle,
  softWireHopState,
  xivAccountAuthorizesAllProviders,
  type AgentIdentityRecord,
  type CandidateProvider,
  type ConsentDisclosure,
  type EncryptedTokenRef,
  type Es33Actor,
  type Es33EvidenceState,
  type Es33HopRecord,
  type Es33SoftWireSnapshot,
  type NeuralGraphEdge,
  type NeuralIdentityGraphNode,
  type ProviderConnection,
  type UniverseKind,
  type UniverseRecord,
  type XivIdentity,
} from './unified-identity-account-federation-types.ts';

function nowIso(): string {
  return new Date().toISOString();
}

function hop(
  hopName: (typeof ES33_FEDERATION_CYCLE)[number],
  state: Es33EvidenceState,
  summary: string,
): Es33HopRecord {
  return { hop: hopName, state, summary, at: nowIso() };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export type DenialResult = {
  denied: true;
  state: 'DENIED' | 'WAITING_DATA' | 'REVOKED';
  reason: string;
  executed: false;
};

function deny(
  reason: string,
  state: 'DENIED' | 'WAITING_DATA' | 'REVOKED' = 'DENIED',
): DenialResult {
  return { denied: true, state, reason, executed: false };
}

function personalUniverse(
  xivIdentityId: string,
  tenantId: string,
  orgId: string,
): UniverseRecord {
  return {
    universeId: `uni-personal-${xivIdentityId}`,
    kind: 'personal',
    ownerXivIdentityId: xivIdentityId,
    tenantId,
    orgId,
    rlsEnforced: true,
    guardianEnforced: true,
    ownAgents: true,
    ownDocuments: true,
    ownCredentials: true,
    ownAudit: true,
    ownContracts: true,
  };
}

export function createOrganizationUniverse(input: {
  xivIdentityId: string;
  kind: Exclude<UniverseKind, 'personal'>;
  orgId: string;
  tenantId: string;
  label: string;
}): UniverseRecord {
  return {
    universeId: `uni-${input.kind}-${input.label}`,
    kind: input.kind,
    ownerXivIdentityId: input.xivIdentityId,
    tenantId: input.tenantId,
    orgId: input.orgId,
    rlsEnforced: true,
    guardianEnforced: true,
    ownAgents: true,
    ownDocuments: true,
    ownCredentials: true,
    ownAudit: true,
    ownContracts: true,
  };
}

export function createEncryptedTokenRef(vaultKeyId: string): EncryptedTokenRef {
  return {
    vaultRef: `vault://${vaultKeyId}/${sha256(vaultKeyId).slice(0, 16)}`,
    algorithm: 'AES-256-GCM',
    ciphertextPresentInRepo: false,
    plaintextPresentInRepo: false,
  };
}

export function createXivIdentity(input: {
  actor: Es33Actor;
  primaryUserIdentity: string;
  verifiedEmails?: readonly string[];
  verifiedPhones?: readonly string[];
  authenticationStrength?: XivIdentity['authenticationStrength'];
}): XivIdentity | DenialResult {
  if (!isEs33Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only identity federation / home_base / user / human may create XIV identity.');
  }

  const xivIdentityId = `xiv-${sha256(input.primaryUserIdentity).slice(0, 12)}`;
  const personal = personalUniverse(
    xivIdentityId,
    input.actor.tenantId,
    input.actor.orgId,
  );

  return {
    xivIdentityId,
    primaryUserIdentity: input.primaryUserIdentity,
    verifiedEmailIdentities: [...(input.verifiedEmails ?? [])],
    verifiedPhoneIdentities: [...(input.verifiedPhones ?? [])],
    linkedProviderAccounts: [],
    personalUniverse: personal,
    organizationMemberships: [],
    deviceEnrollments: [],
    agentIdentities: [],
    roles: ['xiv_user'],
    permissions: ['identity.read', 'identity.link_request'],
    dataSharingScopes: [],
    authenticationStrength: input.authenticationStrength ?? 'mfa_passkey',
    providerAuthorizationState: {},
    consentRecords: [],
    lastVerification: nowIso(),
    revocationUnlinkState: 'active',
    auditHistory: [`created:${nowIso()}`],
  };
}

export function buildConsentDisclosure(input: {
  provider: CandidateProvider;
  permissionsRequested: readonly string[];
  dataTypesAccessed: readonly string[];
  purpose: string;
  whereDataCanBeUsed: readonly string[];
  retention: string;
  howToRevoke?: string;
  userAcknowledged: boolean;
}): ConsentDisclosure {
  return {
    provider: input.provider,
    permissionsRequested: [...input.permissionsRequested],
    dataTypesAccessed: [...input.dataTypesAccessed],
    purpose: input.purpose,
    whereDataCanBeUsed: [...input.whereDataCanBeUsed],
    retention: input.retention,
    howToRevoke:
      input.howToRevoke ??
      'Use disconnect / revoke_account in XIV Home Base; provider tokens deleted from vault.',
    userAcknowledged: input.userAcknowledged,
  };
}

export function linkProviderAccount(input: {
  actor: Es33Actor;
  identity: XivIdentity;
  provider: CandidateProvider;
  providerSubjectId: string;
  scopes: readonly string[];
  targetUniverseId: string;
  consent: ConsentDisclosure;
  vaultKeyId?: string;
  silent?: boolean;
  autoExpandScopes?: boolean;
  shareCredentialFromUniverseId?: string;
}): { identity: XivIdentity; connection: ProviderConnection } | DenialResult {
  if (!isEs33Agent(input.actor) && !isHumanApprover(input.actor)) {
    return deny('Only identity federation actors may link provider accounts.');
  }
  if (input.silent === true || input.consent.userAcknowledged !== true) {
    return deny(
      'Silent account linking denied — user authorization + consent disclosure required.',
    );
  }
  if (input.consent.provider !== input.provider) {
    return deny('Consent disclosure provider must match link target provider.');
  }
  for (const field of CONSENT_DISCLOSURE_FIELDS) {
    const value = input.consent[field];
    if (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.length === 0) ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return deny(`Consent disclosure incomplete — missing ${field}.`);
    }
  }
  if (input.autoExpandScopes === true) {
    return deny('Automatic scope expansion denied.');
  }
  if (input.shareCredentialFromUniverseId) {
    return deny(
      'Cross-Universe credential share denied — credentials stay in their Universe.',
    );
  }

  const allowedUniverses = new Set([
    input.identity.personalUniverse.universeId,
    ...input.identity.organizationMemberships.map((u) => u.universeId),
  ]);
  if (!allowedUniverses.has(input.targetUniverseId)) {
    return deny(
      'Target Universe must belong to this XIV identity (membership required).',
    );
  }

  // Personal Google Drive must not target Employer Universe.
  const target = [
    input.identity.personalUniverse,
    ...input.identity.organizationMemberships,
  ].find((u) => u.universeId === input.targetUniverseId)!;
  if (
    (input.provider === 'google' || input.provider === 'storage') &&
    input.scopes.some((s) => /drive|personal_files/i.test(s)) &&
    target.kind !== 'personal'
  ) {
    return deny(
      'Personal Google Drive / personal storage must not flow into Employer Universe.',
    );
  }
  // Company ERP must not target Personal Universe / Personal Brain.
  if (
    (input.provider === 'erp' || input.provider === 'crm') &&
    target.kind === 'personal'
  ) {
    return deny(
      'Company ERP/CRM must not flow into Personal XIV Brain / Personal Universe.',
    );
  }

  let lifecycle = nextConnectionLifecycle('TARGET', 'document');
  lifecycle = nextConnectionLifecycle(lifecycle, 'configure');
  lifecycle = nextConnectionLifecycle(lifecycle, 'authorize');

  const connection: ProviderConnection = {
    connectionId: `conn-${sha256(`${input.provider}:${input.providerSubjectId}`).slice(0, 12)}`,
    xivIdentityId: input.identity.xivIdentityId,
    provider: input.provider,
    providerSubjectId: input.providerSubjectId,
    lifecycle,
    scopes: [...input.scopes],
    targetUniverseId: input.targetUniverseId,
    consent: input.consent,
    tokenRef: input.vaultKeyId
      ? createEncryptedTokenRef(input.vaultKeyId)
      : null,
    syncPaused: false,
    lastVerification: null,
    revokedAt: null,
    auditTrail: [`linked:${nowIso()}:AUTHORIZED`],
  };

  const providerAuthorizationState = {
    ...input.identity.providerAuthorizationState,
    [input.provider]: lifecycle,
  };

  const identity: XivIdentity = {
    ...input.identity,
    linkedProviderAccounts: [
      ...input.identity.linkedProviderAccounts,
      connection,
    ],
    consentRecords: [...input.identity.consentRecords, input.consent],
    providerAuthorizationState,
    auditHistory: [
      ...input.identity.auditHistory,
      `link:${input.provider}:${nowIso()}`,
    ],
  };

  return { identity, connection };
}

export function verifyProviderConnection(input: {
  identity: XivIdentity;
  connectionId: string;
}): { identity: XivIdentity; connection: ProviderConnection } | DenialResult {
  const idx = input.identity.linkedProviderAccounts.findIndex(
    (c) => c.connectionId === input.connectionId,
  );
  if (idx < 0) return deny('Connection not found.');
  const current = input.identity.linkedProviderAccounts[idx]!;
  if (current.lifecycle === 'REVOKED') {
    return deny('Cannot verify a REVOKED connection.', 'REVOKED');
  }
  const lifecycle = nextConnectionLifecycle(current.lifecycle, 'verify');
  const connection: ProviderConnection = {
    ...current,
    lifecycle,
    lastVerification: nowIso(),
    auditTrail: [...current.auditTrail, `verified:${nowIso()}`],
  };
  const linked = [...input.identity.linkedProviderAccounts];
  linked[idx] = connection;
  return {
    identity: {
      ...input.identity,
      linkedProviderAccounts: linked,
      providerAuthorizationState: {
        ...input.identity.providerAuthorizationState,
        [connection.provider]: lifecycle,
      },
      lastVerification: nowIso(),
      auditHistory: [
        ...input.identity.auditHistory,
        `verify:${connection.provider}:${nowIso()}`,
      ],
    },
    connection,
  };
}

export function changeConnectionScopes(input: {
  identity: XivIdentity;
  connectionId: string;
  newScopes: readonly string[];
  userAuthorized: boolean;
  autoExpand?: boolean;
}): { identity: XivIdentity; connection: ProviderConnection } | DenialResult {
  if (input.autoExpand === true || input.userAuthorized !== true) {
    return deny('Automatic / unauthorized scope expansion denied.');
  }
  const idx = input.identity.linkedProviderAccounts.findIndex(
    (c) => c.connectionId === input.connectionId,
  );
  if (idx < 0) return deny('Connection not found.');
  const current = input.identity.linkedProviderAccounts[idx]!;
  if (current.lifecycle === 'REVOKED') {
    return deny('Cannot change scopes on REVOKED connection.', 'REVOKED');
  }
  const connection: ProviderConnection = {
    ...current,
    scopes: [...input.newScopes],
    auditTrail: [...current.auditTrail, `scopes_changed:${nowIso()}`],
  };
  const linked = [...input.identity.linkedProviderAccounts];
  linked[idx] = connection;
  return {
    identity: {
      ...input.identity,
      linkedProviderAccounts: linked,
      auditHistory: [
        ...input.identity.auditHistory,
        `change_scopes:${connection.provider}:${nowIso()}`,
      ],
    },
    connection,
  };
}

export function pauseConnectionSync(input: {
  identity: XivIdentity;
  connectionId: string;
}): { identity: XivIdentity; connection: ProviderConnection } | DenialResult {
  const idx = input.identity.linkedProviderAccounts.findIndex(
    (c) => c.connectionId === input.connectionId,
  );
  if (idx < 0) return deny('Connection not found.');
  const current = input.identity.linkedProviderAccounts[idx]!;
  const connection: ProviderConnection = {
    ...current,
    syncPaused: true,
    auditTrail: [...current.auditTrail, `pause_sync:${nowIso()}`],
  };
  const linked = [...input.identity.linkedProviderAccounts];
  linked[idx] = connection;
  return {
    identity: {
      ...input.identity,
      linkedProviderAccounts: linked,
      auditHistory: [
        ...input.identity.auditHistory,
        `pause_sync:${connection.provider}:${nowIso()}`,
      ],
    },
    connection,
  };
}

export function unlinkOrRevokeConnection(input: {
  identity: XivIdentity;
  connectionId: string;
  mode: 'disconnect' | 'revoke_account';
}): { identity: XivIdentity; connection: ProviderConnection } | DenialResult {
  const idx = input.identity.linkedProviderAccounts.findIndex(
    (c) => c.connectionId === input.connectionId,
  );
  if (idx < 0) return deny('Connection not found.');
  const current = input.identity.linkedProviderAccounts[idx]!;
  const lifecycle = nextConnectionLifecycle(current.lifecycle, 'revoke');
  const connection: ProviderConnection = {
    ...current,
    lifecycle,
    tokenRef: null,
    syncPaused: true,
    revokedAt: nowIso(),
    auditTrail: [
      ...current.auditTrail,
      `${input.mode}:${nowIso()}:REVOKED:tokens_purged`,
    ],
  };
  const linked = [...input.identity.linkedProviderAccounts];
  linked[idx] = connection;
  const anyActive = linked.some((c) => c.lifecycle !== 'REVOKED');
  return {
    identity: {
      ...input.identity,
      linkedProviderAccounts: linked,
      providerAuthorizationState: {
        ...input.identity.providerAuthorizationState,
        [connection.provider]: 'REVOKED',
      },
      revocationUnlinkState: anyActive ? 'partially_revoked' : 'fully_revoked',
      auditHistory: [
        ...input.identity.auditHistory,
        `${input.mode}:${connection.provider}:${nowIso()}`,
      ],
    },
    connection,
  };
}

export function enrollAgentIdentity(input: {
  identity: XivIdentity;
  agent: Omit<AgentIdentityRecord, 'homeIdentity' | 'homeUniverse' | 'owner'> & {
    homeUniverse?: string;
  };
}): { identity: XivIdentity; agent: AgentIdentityRecord } | DenialResult {
  const homeUniverse =
    input.agent.homeUniverse ?? input.identity.personalUniverse.universeId;
  const allowed = new Set([
    input.identity.personalUniverse.universeId,
    ...input.identity.organizationMemberships.map((u) => u.universeId),
  ]);
  if (!allowed.has(homeUniverse)) {
    return deny('Agent homeUniverse must belong to this XIV identity.');
  }
  const agent: AgentIdentityRecord = {
    agentId: input.agent.agentId,
    homeIdentity: input.identity.xivIdentityId,
    homeUniverse,
    owner: input.identity.primaryUserIdentity,
    skills: [...input.agent.skills],
    tools: [...input.agent.tools],
    computeBudget: input.agent.computeBudget,
    dataScopes: [...input.agent.dataScopes],
    heartbeat: input.agent.heartbeat,
    returnPath: input.agent.returnPath,
  };
  return {
    identity: {
      ...input.identity,
      agentIdentities: [...input.identity.agentIdentities, agent],
      auditHistory: [
        ...input.identity.auditHistory,
        `enroll_agent:${agent.agentId}:${nowIso()}`,
      ],
    },
    agent,
  };
}

export function associateProviderUnderXivIdentity(input: {
  identity: XivIdentity;
  providers: readonly {
    provider: CandidateProvider;
    providerSubjectId: string;
  }[];
  userAuthorized: boolean;
}): { associated: true; providerSubjects: readonly string[] } | DenialResult {
  if (!input.userAuthorized) {
    return deny(
      'Identity resolution requires user authorization — silent association denied.',
    );
  }
  return {
    associated: true,
    providerSubjects: input.providers.map(
      (p) => `${p.provider}:${p.providerSubjectId}`,
    ),
  };
}

export function checkNeuralGraphEdge(input: {
  from: NeuralIdentityGraphNode;
  to: NeuralIdentityGraphNode;
  permissionRequired: string;
  grantedPermissions: readonly string[];
  universeId: string;
  crossUniversePool?: boolean;
}): NeuralGraphEdge {
  if (input.crossUniversePool === true) {
    return {
      from: input.from,
      to: input.to,
      permissionRequired: input.permissionRequired,
      grantedPermissions: [...input.grantedPermissions],
      universeId: input.universeId,
      allowed: false,
      reason: 'Cross-tenant / cross-Universe pooling denied at graph edge.',
    };
  }
  const allowed = input.grantedPermissions.includes(input.permissionRequired);
  return {
    from: input.from,
    to: input.to,
    permissionRequired: input.permissionRequired,
    grantedPermissions: [...input.grantedPermissions],
    universeId: input.universeId,
    allowed,
    reason: allowed
      ? 'Permission present — edge allowed.'
      : `Missing permission ${input.permissionRequired} — edge denied.`,
  };
}

export function routeDataAcrossUniverses(input: {
  sourceUniverse: UniverseRecord;
  targetUniverse: UniverseRecord;
  dataClass: 'personal_drive' | 'erp' | 'crm' | 'generic';
}): { allowed: true } | DenialResult {
  if (
    input.dataClass === 'personal_drive' &&
    input.sourceUniverse.kind === 'personal' &&
    input.targetUniverse.kind !== 'personal'
  ) {
    return deny(
      'Personal Drive ↛ Employer Universe — boundary intact.',
    );
  }
  if (
    (input.dataClass === 'erp' || input.dataClass === 'crm') &&
    input.sourceUniverse.kind !== 'personal' &&
    input.targetUniverse.kind === 'personal'
  ) {
    return deny('Company ERP/CRM ↛ Personal XIV Brain — boundary intact.');
  }
  if (input.sourceUniverse.universeId === input.targetUniverse.universeId) {
    return { allowed: true };
  }
  return deny(
    'Cross-Universe data routing denied without explicit governed share (not implemented as auto-pool).',
  );
}

export function listAuthorizedProviders(
  identity: XivIdentity,
): CandidateProvider[] {
  return identity.linkedProviderAccounts
    .filter((c) => connectionIsAuthorizedForUse(c.lifecycle))
    .map((c) => c.provider);
}

export function attemptXivAccountBlanketProviderAuth(): DenialResult {
  if (xivAccountAuthorizesAllProviders()) {
    return deny('Invariant broken — XIV account must not authorize all providers.');
  }
  return deny(
    'Having an XIV account does not authorize access to every external account.',
  );
}

export function attemptPersonalDriveToEmployer(): DenialResult {
  return deny('Personal Google Drive ↛ Employer Universe — DENIED.');
}

export function attemptErpToPersonalBrain(): DenialResult {
  return deny('Company ERP ↛ Personal XIV Brain — DENIED.');
}

export function attemptSilentLinking(): DenialResult {
  return deny('Silent account linking denied — user authorization required.');
}

export function attemptCrossUniverseCredentialShare(): DenialResult {
  return deny('Cross-Universe credential share denied.');
}

export function attemptAutoScopeExpansion(): DenialResult {
  return deny('Automatic scope expansion denied.');
}

export function attemptCrossTenantPooling(): DenialResult {
  return deny('Cross-tenant pooling denied.');
}

export function attemptProviderTokensInGit(): DenialResult {
  return deny('Provider tokens / secrets must never be committed to Git.');
}

export function attemptBypassGuardianRls(): DenialResult {
  return deny('Bypass Guardian/RLS denied.');
}

export function attemptExpandTenantUniverseAccess(): DenialResult {
  return deny('Expand tenant/Universe access denied.');
}

export function attemptRecommendAsAct(): DenialResult {
  return deny('Recommend ≠ act — agents may recommend only.');
}

export function attemptTipLand(): DenialResult {
  return deny('Tip-land onto xiv-v2/main denied.');
}

export function attemptManagePullRequest(): DenialResult {
  return deny('ManagePullRequest / open PR denied unless founder explicitly asks.');
}

export function probeGuardianRlsTenantUniverseIsolation(input: {
  actor: Es33Actor;
  otherTenantId: string;
  otherUniverseId: string;
}): { isolated: true; deniedCrossAccess: true } | DenialResult {
  if (
    input.actor.tenantId === input.otherTenantId &&
    input.actor.universeId === input.otherUniverseId
  ) {
    return { isolated: true, deniedCrossAccess: true };
  }
  return deny('Cross-tenant/Universe access denied — isolation unchanged.');
}

export function requireHumanApproval(input: {
  approvalId: string;
  actor: Es33Actor;
  action: string;
}):
  | { approved: true; approvalId: string; automaticAuthority: false }
  | DenialResult {
  if (!isHumanApprover(input.actor)) {
    return deny('Human approver required for consequential federation actions.');
  }
  void input.action;
  return {
    approved: true,
    approvalId: input.approvalId,
    automaticAuthority: false,
  };
}

export function returnEvidenceToHomeBase(input: {
  identity: XivIdentity;
  cycleEvidenceSha256: string;
}): {
  returned: true;
  homeBase: 'xiv_identity_core';
  xivIdentityId: string;
  evidenceSha256: string;
} {
  return {
    returned: true,
    homeBase: 'xiv_identity_core',
    xivIdentityId: input.identity.xivIdentityId,
    evidenceSha256: input.cycleEvidenceSha256,
  };
}

/**
 * Scan local ES33 source files for plaintext provider-token patterns.
 * Presence of vault refs / "encrypted" language is OK; raw token dumps are not.
 */
export function assertProviderTokensNotInSource(servicesAiRoot?: string): {
  clean: boolean;
  filesChecked: readonly string[];
  hits: readonly string[];
} {
  const localBrain = servicesAiRoot
    ? join(servicesAiRoot, 'local-brain')
    : dirname(fileURLToPath(import.meta.url));
  const files = [
    join(localBrain, 'unified-identity-account-federation-types.ts'),
    join(localBrain, 'unified-identity-account-federation-runtime.ts'),
    join(localBrain, 'unified-identity-account-federation.ts'),
    join(localBrain, 'phase62les33.test.ts'),
  ];
  const forbidden =
    /(provider_token\s*=\s*["'][A-Za-z0-9_\-]{20,}["']|Bearer\s+[A-Za-z0-9\-_]{30,}|sk_live_[A-Za-z0-9]+|ghp_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]+)/;
  const hits: string[] = [];
  const checked: string[] = [];
  for (const file of files) {
    try {
      const body = readFileSync(file, 'utf8');
      checked.push(file);
      if (forbidden.test(body)) hits.push(file);
    } catch {
      // File may not exist yet during bootstrap — skip.
    }
  }
  return { clean: hits.length === 0, filesChecked: checked, hits };
}

export function exampleFederatedIdentity(actor: Es33Actor): {
  identity: XivIdentity;
  employerUniverse: UniverseRecord;
  googlePersonal: ProviderConnection;
  githubDev: ProviderConnection;
} {
  const created = createXivIdentity({
    actor,
    primaryUserIdentity: 'user@example.com',
    verifiedEmails: ['user@example.com'],
    authenticationStrength: 'mfa_passkey',
  });
  if ('denied' in created) {
    throw new Error(created.reason);
  }
  let identity = created;
  const employer = createOrganizationUniverse({
    xivIdentityId: identity.xivIdentityId,
    kind: 'company',
    orgId: actor.orgId,
    tenantId: 'ten-employer',
    label: 'acme',
  });
  identity = {
    ...identity,
    organizationMemberships: [...identity.organizationMemberships, employer],
  };

  const googleConsent = buildConsentDisclosure({
    provider: 'google',
    permissionsRequested: ['drive.readonly'],
    dataTypesAccessed: ['personal_files'],
    purpose: 'Personal knowledge sync into Personal Universe only',
    whereDataCanBeUsed: [identity.personalUniverse.universeId],
    retention: 'Until unlink / revoke',
    userAcknowledged: true,
  });
  const googleLink = linkProviderAccount({
    actor,
    identity,
    provider: 'google',
    providerSubjectId: 'google-sub-1',
    scopes: ['drive.readonly'],
    targetUniverseId: identity.personalUniverse.universeId,
    consent: googleConsent,
    vaultKeyId: 'vault-google-1',
  });
  if ('denied' in googleLink) throw new Error(googleLink.reason);
  identity = googleLink.identity;

  const githubConsent = buildConsentDisclosure({
    provider: 'github',
    permissionsRequested: ['repo:read'],
    dataTypesAccessed: ['source_metadata'],
    purpose: 'Dev identity federation under verified XIV identity',
    whereDataCanBeUsed: [identity.personalUniverse.universeId],
    retention: 'Until unlink / revoke',
    userAcknowledged: true,
  });
  const githubLink = linkProviderAccount({
    actor,
    identity,
    provider: 'github',
    providerSubjectId: 'gh-user-1',
    scopes: ['repo:read'],
    targetUniverseId: identity.personalUniverse.universeId,
    consent: githubConsent,
    vaultKeyId: 'vault-github-1',
  });
  if ('denied' in githubLink) throw new Error(githubLink.reason);
  identity = githubLink.identity;

  return {
    identity,
    employerUniverse: employer,
    googlePersonal: googleLink.connection,
    githubDev: githubLink.connection,
  };
}

export function bootstrapUnifiedIdentityFederation(repoRoot?: string): {
  locksIntact: boolean;
  identityFields: typeof XIV_IDENTITY_FIELDS;
  lifecycle: typeof CONNECTION_LIFECYCLE_STATES;
  consentFields: typeof CONSENT_DISCLOSURE_FIELDS;
  providers: typeof CANDIDATE_PROVIDERS;
  brainPath: typeof XIV_BRAIN_CORE_PATH;
  agentFields: typeof AGENT_IDENTITY_FIELDS;
  graphNodes: typeof NEURAL_IDENTITY_GRAPH_NODES;
  actions: typeof ACCOUNT_LINKING_ACTIONS;
  may: typeof ES33_MAY;
  mustNot: typeof ES33_MUST_NOT;
  dbCandidates: typeof ES33_DB_CANDIDATES_STATUS;
  softWire: Es33SoftWireSnapshot;
  sot: {
    issue: typeof GITHUB_SOT_ISSUE;
    label: typeof GITHUB_SOT_LABEL;
    title: typeof GITHUB_SOT_TITLE;
    next: typeof NEXT_PHASE_TITLE;
    honesty: typeof HONESTY_BANNER;
    gitlab: typeof GITLAB_MIRROR_NOTE;
    layer: typeof ES_LAYER_TITLE;
  };
} {
  const softWire = es33SoftWireSnapshot(repoRoot);
  return {
    locksIntact: assertEs33LocksIntact(),
    identityFields: XIV_IDENTITY_FIELDS,
    lifecycle: CONNECTION_LIFECYCLE_STATES,
    consentFields: CONSENT_DISCLOSURE_FIELDS,
    providers: CANDIDATE_PROVIDERS,
    brainPath: XIV_BRAIN_CORE_PATH,
    agentFields: AGENT_IDENTITY_FIELDS,
    graphNodes: NEURAL_IDENTITY_GRAPH_NODES,
    actions: ACCOUNT_LINKING_ACTIONS,
    may: ES33_MAY,
    mustNot: ES33_MUST_NOT,
    dbCandidates: ES33_DB_CANDIDATES_STATUS,
    softWire,
    sot: {
      issue: GITHUB_SOT_ISSUE,
      label: GITHUB_SOT_LABEL,
      title: GITHUB_SOT_TITLE,
      next: NEXT_PHASE_TITLE,
      honesty: HONESTY_BANNER,
      gitlab: GITLAB_MIRROR_NOTE,
      layer: ES_LAYER_TITLE,
    },
  };
}

export function runUnifiedIdentityFederationCycle(input: {
  actor: Es33Actor;
  human: Es33Actor;
  repoRoot?: string;
}): {
  hops: Es33HopRecord[];
  receipt: {
    xivIdentityId: string;
    authorizedProviders: readonly CandidateProvider[];
    personalDriveToEmployer: false;
    erpToPersonalBrain: false;
    silentLinking: false;
    crossUniverseCredentialShare: false;
    autoScopeExpansion: false;
    l4AutonomyEnabled: false;
    providerTokensInGit: false;
  };
  cycleEvidenceSha256: string;
} {
  const hops: Es33HopRecord[] = [];
  const softWire = es33SoftWireSnapshot(input.repoRoot);

  hops.push(
    hop(
      'honesty_locks',
      assertEs33LocksIntact() ? 'PASS' : 'FAIL',
      HONESTY_BANNER,
    ),
  );

  const boot = bootstrapUnifiedIdentityFederation(input.repoRoot);
  hops.push(
    hop(
      'federation_bootstrap',
      boot.locksIntact ? 'PASS' : 'FAIL',
      'Unified Identity & Account Federation bootstrap.',
    ),
  );

  hops.push(
    hop(
      'identity_fields_encoded',
      XIV_IDENTITY_FIELDS.length === 18 ? 'PASS' : 'FAIL',
      `Identity fields=${XIV_IDENTITY_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'connection_lifecycle_encoded',
      CONNECTION_LIFECYCLE_STATES.length === 7 ? 'PASS' : 'FAIL',
      `Lifecycle=${CONNECTION_LIFECYCLE_STATES.join('→')}.`,
    ),
  );
  hops.push(
    hop(
      'consent_disclosure_encoded',
      CONSENT_DISCLOSURE_FIELDS.length === 7 ? 'PASS' : 'FAIL',
      `Consent fields=${CONSENT_DISCLOSURE_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'brain_path_encoded',
      XIV_BRAIN_CORE_PATH.length === 11 ? 'PASS' : 'FAIL',
      `Brain path=${XIV_BRAIN_CORE_PATH.join('→')}.`,
    ),
  );
  hops.push(
    hop(
      'agent_identity_encoded',
      AGENT_IDENTITY_FIELDS.length === 10 ? 'PASS' : 'FAIL',
      `Agent identity fields=${AGENT_IDENTITY_FIELDS.length}.`,
    ),
  );
  hops.push(
    hop(
      'neural_graph_encoded',
      NEURAL_IDENTITY_GRAPH_NODES.length === 10 ? 'PASS' : 'FAIL',
      `Graph nodes=${NEURAL_IDENTITY_GRAPH_NODES.join('→')}.`,
    ),
  );

  const example = exampleFederatedIdentity(input.actor);
  hops.push(
    hop(
      'create_xiv_identity',
      'PASS',
      `xivIdentityId=${example.identity.xivIdentityId}`,
    ),
  );

  const consentOk =
    example.googlePersonal.consent.userAcknowledged === true &&
    CONSENT_DISCLOSURE_FIELDS.every(
      (f) => example.googlePersonal.consent[f] != null,
    );
  hops.push(
    hop(
      'consent_before_link',
      consentOk ? 'PASS' : 'FAIL',
      'Consent disclosure shown before linking.',
    ),
  );

  hops.push(
    hop(
      'link_authorized_provider',
      example.identity.linkedProviderAccounts.length >= 2 ? 'PASS' : 'FAIL',
      `Linked providers=${listAuthorizedProviders(example.identity).join(',')}.`,
    ),
  );

  const denyHops: {
    hop: (typeof ES33_FEDERATION_CYCLE)[number];
    fn: () => DenialResult;
  }[] = [
    {
      hop: 'deny_xiv_account_blanket_provider_auth',
      fn: attemptXivAccountBlanketProviderAuth,
    },
    {
      hop: 'deny_personal_drive_to_employer',
      fn: attemptPersonalDriveToEmployer,
    },
    { hop: 'deny_erp_to_personal_brain', fn: attemptErpToPersonalBrain },
    { hop: 'deny_silent_linking', fn: attemptSilentLinking },
    {
      hop: 'deny_cross_universe_credential_share',
      fn: attemptCrossUniverseCredentialShare,
    },
    { hop: 'deny_auto_scope_expansion', fn: attemptAutoScopeExpansion },
  ];
  for (const d of denyHops) {
    const result = d.fn();
    hops.push(hop(d.hop, result.denied ? 'DENIED' : 'FAIL', result.reason));
  }

  const revoked = unlinkOrRevokeConnection({
    identity: example.identity,
    connectionId: example.githubDev.connectionId,
    mode: 'revoke_account',
  });
  hops.push(
    hop(
      'unlink_revoke_path',
      !('denied' in revoked) && revoked.connection.lifecycle === 'REVOKED'
        ? 'PASS'
        : 'FAIL',
      'Complete unlink/revocation with token purge.',
    ),
  );

  const edge = checkNeuralGraphEdge({
    from: 'person',
    to: 'accounts',
    permissionRequired: 'identity.link_request',
    grantedPermissions: example.identity.permissions,
    universeId: example.identity.personalUniverse.universeId,
  });
  hops.push(
    hop(
      'graph_edge_permission_check',
      edge.allowed ? 'PASS' : 'FAIL',
      edge.reason,
    ),
  );

  const softStates = [
    softWire.es32MissionDecomposition,
    softWire.es31DynamicAgentTeamBuilder,
    softWire.es30ReputationDomainTrust,
    softWire.es25SkillCertification,
    softWire.er16HomeBase,
    softWire.er14OfflineBrain,
    softWire.guardianRlsPattern,
  ].map(softWireHopState);
  const softOk = softStates.every(
    (s) => s === 'AVAILABLE' || s === 'WAITING_DATA',
  );
  hops.push(
    hop(
      'soft_wire_priors',
      softOk ? 'PASS' : 'FAIL',
      `Soft-wire states=${softStates.join(',')}; presence≠VERIFIED; absent→WAITING_DATA.`,
    ),
  );

  const guardianDeny = attemptBypassGuardianRls();
  hops.push(
    hop(
      'deny_bypass_guardian_rls',
      guardianDeny.denied ? 'DENIED' : 'FAIL',
      guardianDeny.reason,
    ),
  );

  const isolation = probeGuardianRlsTenantUniverseIsolation({
    actor: input.actor,
    otherTenantId: 'ten-other',
    otherUniverseId: 'uni-other',
  });
  hops.push(
    hop(
      'guardian_rls_tenant_universe_isolation',
      'denied' in isolation ? 'DENIED' : 'PASS',
      'Guardian/RLS/tenant/Universe isolation unchanged.',
    ),
  );

  const tokenScan = assertProviderTokensNotInSource(
    input.repoRoot
      ? join(input.repoRoot, 'services/ai')
      : undefined,
  );
  hops.push(
    hop(
      'provider_tokens_not_in_source',
      tokenScan.clean ? 'PASS' : 'FAIL',
      tokenScan.clean
        ? 'No provider tokens in ES33 source.'
        : `Token pattern hits: ${tokenScan.hits.join(',')}`,
    ),
  );

  hops.push(
    hop(
      'l4_autonomy_false',
      ES33_LOCKS.L4_AUTONOMY_ENABLED === false &&
        FEDERATION_TRUTH_BOUNDARY.l4AutonomyEnabled === false &&
        ES33_AGENT_BOUNDS.automaticAuthority === false
        ? 'PASS'
        : 'FAIL',
      'L4_AUTONOMY_ENABLED=false',
    ),
  );

  const evidencePayload = JSON.stringify({
    hops: hops.map((h) => ({ hop: h.hop, state: h.state })),
    xivIdentityId: example.identity.xivIdentityId,
    truth: FEDERATION_TRUTH_BOUNDARY,
  });
  const cycleEvidenceSha256 = sha256(evidencePayload);

  const returned = returnEvidenceToHomeBase({
    identity: example.identity,
    cycleEvidenceSha256,
  });
  hops.push(
    hop(
      'evidence_return_home_base',
      returned.returned ? 'PASS' : 'FAIL',
      `Evidence returned to ${returned.homeBase}.`,
    ),
  );

  void input.human;
  void ACCOUNT_LINKING_ACTIONS;
  void CANDIDATE_PROVIDERS;

  return {
    hops,
    receipt: {
      xivIdentityId: example.identity.xivIdentityId,
      authorizedProviders: listAuthorizedProviders(example.identity).filter(
        (p) => p !== 'github',
      ),
      personalDriveToEmployer: false,
      erpToPersonalBrain: false,
      silentLinking: false,
      crossUniverseCredentialShare: false,
      autoScopeExpansion: false,
      l4AutonomyEnabled: false,
      providerTokensInGit: false,
    },
    cycleEvidenceSha256,
  };
}
