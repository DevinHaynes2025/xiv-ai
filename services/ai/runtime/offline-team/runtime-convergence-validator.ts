export type ConvergenceFindingCode =
  | 'SYNTAX_RISK'
  | 'EXPORT_GAP'
  | 'MODULE_MISSING'
  | 'GUARDRAIL_MISSING'
  | 'UNSAFE_CLOUD_STATE';

export interface ConvergenceFinding {
  code: ConvergenceFindingCode;
  message: string;
  severity: 'ERROR' | 'WARN';
}

export interface RuntimeConvergenceInput {
  missionSchedulerSource: string;
  barrelSource: string;
  availableModules: readonly string[];
  storageCompilerSource?: string;
  communityUniverseSource?: string;
}

export interface RuntimeConvergenceResult {
  ok: boolean;
  localFirst: boolean;
  cloudExecutionVerified: false;
  productionMutationAllowed: false;
  findings: readonly ConvergenceFinding[];
}

const REQUIRED_MODULES = Object.freeze([
  'storage-compiler',
  'mission-scheduler',
  'community-universe',
  'runtime-convergence-validator',
]);

export function validateRuntimeConvergence(input: RuntimeConvergenceInput): RuntimeConvergenceResult {
  const findings: ConvergenceFinding[] = [];
  const modules = new Set(input.availableModules);

  if (input.missionSchedulerSource.includes('}))));')) {
    findings.push({ code: 'SYNTAX_RISK', severity: 'ERROR', message: 'mission-scheduler contains the known extra-closing-parenthesis defect' });
  }

  for (const moduleName of REQUIRED_MODULES) {
    if (!modules.has(moduleName)) {
      findings.push({ code: 'MODULE_MISSING', severity: 'ERROR', message: `required runtime module missing: ${moduleName}` });
    }
    if (!input.barrelSource.includes(`export * from './${moduleName}';`)) {
      findings.push({ code: 'EXPORT_GAP', severity: 'ERROR', message: `offline-team barrel does not export ${moduleName}` });
    }
  }

  const storage = input.storageCompilerSource ?? '';
  const community = input.communityUniverseSource ?? '';
  const requiredStorageGuards = [
    'localFirst: true',
    'autonomousCloudCreation: false',
    'autonomousProductionReplication: false',
    'crossTenantReplicationAllowed: false',
  ];
  for (const guard of requiredStorageGuards) {
    if (!storage.includes(guard)) findings.push({ code: 'GUARDRAIL_MISSING', severity: 'ERROR', message: `storage guardrail missing: ${guard}` });
  }

  if (storage.includes("status: 'CLOUD_CONFIRMED'") && !storage.includes("status: 'PLANNED'")) {
    findings.push({ code: 'UNSAFE_CLOUD_STATE', severity: 'ERROR', message: 'cloud replicas appear confirmed without a planned-only path' });
  }

  const requiredUniverseGuards = [
    'simulationOnly: true',
    'crossTenantPrivateDataAllowed: false',
    'autonomousProductionMutationAllowed: false',
  ];
  for (const guard of requiredUniverseGuards) {
    if (!community.includes(guard)) findings.push({ code: 'GUARDRAIL_MISSING', severity: 'ERROR', message: `community guardrail missing: ${guard}` });
  }

  return Object.freeze({
    ok: findings.every((finding) => finding.severity !== 'ERROR'),
    localFirst: storage.includes('localFirst: true'),
    cloudExecutionVerified: false as const,
    productionMutationAllowed: false as const,
    findings: Object.freeze(findings),
  });
}
