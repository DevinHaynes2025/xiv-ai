import { localModelStatus } from './local-model';
import { providerSlots } from './provider-fabric';
import { cortexId } from './cortex-store';
import type { PluginRegistryRecord } from './software-factory-plugins';
import type { FactoryCandidateArtifact, PlatformProfileKind } from './software-factory-types';

export type CandidatePlatformProfile = {
  platform: PlatformProfileKind;
  kind: 'build_candidate';
  storePublish: false;
  installerPublish: false;
  customerUseAuthorized: false;
};

export type BusinessAppTemplateId = 'crm' | 'ledger' | 'inventory';

export type BusinessAppTemplate = {
  id: BusinessAppTemplateId;
  files: Array<{ path: string; action: 'create'; unifiedDiff: string }>;
  productionAuthorization: false;
};

export type ConnectorCandidate = {
  id: string;
  provider: string;
  state: 'UNAVAILABLE' | 'AVAILABLE';
  configured: boolean;
  authorized: boolean;
  productionAuthorization: false;
};

export type ModelAdapterCandidate = {
  id: string;
  provider: string;
  state: 'UNAVAILABLE' | 'AVAILABLE';
  cloudFallback: false;
  productionAuthorization: false;
  reason: string;
};

export type MigrationCandidate = {
  id: string;
  sql: string;
  applied: false;
  productionDatabaseChanged: false;
};

export type CompatibilityMatrix = {
  runtime: string;
  pluginVersion: string;
  mobile: 'candidate' | 'incompatible';
  desktop: 'candidate' | 'incompatible';
};

export function mobileCandidateProfile(): CandidatePlatformProfile {
  return {
    platform: 'mobile',
    kind: 'build_candidate',
    storePublish: false,
    installerPublish: false,
    customerUseAuthorized: false,
  };
}

export function desktopCandidateProfile(): CandidatePlatformProfile {
  return {
    platform: 'desktop',
    kind: 'build_candidate',
    storePublish: false,
    installerPublish: false,
    customerUseAuthorized: false,
  };
}

function templateDiff(path: string, body: string) {
  return [
    `--- /dev/null`,
    `+++ b/${path}`,
    '@@ -0,0 +1,3 @@',
    `+// ${body}`,
    '+export const productionAuthorization = false;',
    '+export const released = false;',
  ].join('\n');
}

export function businessAppTemplate(id: BusinessAppTemplateId): BusinessAppTemplate {
  const path = `apps/candidates/${id}/index.ts`;
  return {
    id,
    files: [{ path, action: 'create', unifiedDiff: templateDiff(path, `XIV ${id} business-app template candidate`) }],
    productionAuthorization: false,
  };
}

export function createConnectorCandidate(provider: string): ConnectorCandidate {
  const slot = providerSlots().find((item) => item.provider === provider);
  const configured = slot?.configured === true;
  const authorized = slot?.authorized === true;
  const available = slot?.state === 'AVAILABLE' && configured && authorized;
  return {
    id: cortexId('connector'),
    provider,
    state: available ? 'AVAILABLE' : 'UNAVAILABLE',
    configured: configured,
    authorized: authorized,
    productionAuthorization: false,
  };
}

export async function createModelAdapter(provider: string): Promise<ModelAdapterCandidate> {
  if (provider === 'local' || provider === 'ollama') {
    const status = await localModelStatus();
    return {
      id: cortexId('adapter'),
      provider: status.provider,
      state: status.availability === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
      cloudFallback: false,
      productionAuthorization: false,
      reason: status.reason,
    };
  }
  const slot = providerSlots().find((item) => item.provider === provider);
  return {
    id: cortexId('adapter'),
    provider,
    state: slot?.state === 'AVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE',
    cloudFallback: false,
    productionAuthorization: false,
    reason: slot ? slot.notes : 'Unconfigured model adapter remains UNAVAILABLE.',
  };
}

export function proposeMigrationCandidate(input: { sql: string }) {
  const sql = input.sql.trim();
  if (!sql) return { accepted: false as const, reason: 'Migration candidate requires SQL text.', applied: false as const };
  if (/DISABLE\s+ROW\s+LEVEL\s+SECURITY|DROP\s+POLICY|BYPASSRLS|ALTER\s+ROLE/i.test(sql)) {
    return { accepted: false as const, reason: 'Migration candidate weakens Guardian/RLS or roles. Denied.', applied: false as const, productionDatabaseChanged: false as const };
  }
  const candidate: MigrationCandidate = {
    id: cortexId('mig'),
    sql,
    applied: false,
    productionDatabaseChanged: false,
  };
  return { accepted: true as const, candidate, reason: 'Migration is a candidate only. Not applied.', applied: false as const };
}

export function applyMigrationCandidate(_candidate: MigrationCandidate) {
  return {
    applied: false as const,
    productionDatabaseChanged: false as const,
    reason: 'MIGRATION_CANDIDATE_GATE: factory never applies production or local schema migrations.',
    productionAuthorization: false as const,
  };
}

export function compatibilityMatrix(input: {
  runtime: string;
  pluginVersion: string;
  mobileCompatible?: boolean;
  desktopCompatible?: boolean;
}): CompatibilityMatrix {
  return {
    runtime: input.runtime,
    pluginVersion: input.pluginVersion,
    mobile: input.mobileCompatible === false ? 'incompatible' : 'candidate',
    desktop: input.desktopCompatible === false ? 'incompatible' : 'candidate',
  };
}

export function packageReleaseCandidate(input: {
  compilePass: boolean;
  testsPass: boolean;
  securityPass: boolean;
  plugin?: PluginRegistryRecord;
  matrix: CompatibilityMatrix;
  humanReleaseAuthorized?: boolean;
  deploy?: boolean;
}): {
  artifact: FactoryCandidateArtifact;
  deployBlocked: boolean;
  reason: string;
} {
  const quarantined = input.plugin?.status === 'quarantined' || input.plugin?.status === 'denied';
  const matrixOk = input.matrix.mobile === 'candidate' && input.matrix.desktop === 'candidate';
  const eligible = input.compilePass && input.testsPass && input.securityPass && !quarantined && matrixOk;
  const artifact: FactoryCandidateArtifact = {
    id: cortexId('rc'),
    kind: 'build_candidate',
    compilePass: input.compilePass,
    testsPass: input.testsPass,
    securityPass: input.securityPass,
    eligible,
    released: false,
    published: false,
    productionDeployed: false,
    customerUseAuthorized: false,
    newPermissionsGranted: false,
    productionDatabaseChanged: false,
  };
  if (input.deploy || input.humanReleaseAuthorized) {
    return {
      artifact,
      deployBlocked: true,
      reason: 'HUMAN_RELEASE_GATE_BLOCKS_DEPLOY: compile+tests PASS is not release, publication, production DB change, or customer use.',
    };
  }
  return {
    artifact,
    deployBlocked: true,
    reason: eligible
      ? 'Build candidate packaged. Human release gate has not authorized deployment.'
      : 'Candidate is not eligible for packaging until compile, tests, security, compatibility, and registry gates pass.',
  };
}

export function humanReleaseGate(input: {
  artifact: FactoryCandidateArtifact;
  deploy?: boolean;
  publish?: boolean;
  productionDatabase?: boolean;
  grantNewPermissions?: boolean;
  customerUse?: boolean;
}) {
  if (input.deploy || input.publish || input.productionDatabase || input.grantNewPermissions || input.customerUse) {
    return {
      allowed: false as const,
      released: false as const,
      productionDeployed: false as const,
      published: false as const,
      customerUseAuthorized: false as const,
      newPermissionsGranted: false as const,
      productionDatabaseChanged: false as const,
      reason: 'HUMAN_RELEASE_GATE_BLOCKS_DEPLOY',
    };
  }
  return {
    allowed: false as const,
    released: false as const,
    productionDeployed: false as const,
    published: false as const,
    customerUseAuthorized: false as const,
    newPermissionsGranted: false as const,
    productionDatabaseChanged: false as const,
    reason: 'Human release gate holds the candidate. No implicit release from eligibility.',
    artifactId: input.artifact.id,
  };
}

export function quarantineVulnerability(input: {
  findings: Array<{ severity: string; code: string }>;
}) {
  const critical = input.findings.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH');
  if (critical.length === 0) {
    return { quarantined: false as const, reason: 'No HIGH/CRITICAL findings.', state: 'PASS' as const };
  }
  return {
    quarantined: true as const,
    reason: `VULNERABILITY_QUARANTINE:${critical.map((item) => item.code).join(',')}`,
    state: 'FAIL' as const,
    productionAuthorization: false as const,
  };
}
