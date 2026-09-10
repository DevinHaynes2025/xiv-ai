import type { BuilderDecision, BuilderRequest } from './types';

export const BUILDER_GUARDRAILS = {
  autonomousProductionDDL: false,
  autonomousProductionDML: false,
  autonomousDestructiveMigration: false,
  autonomousSecretCreation: false,
  autonomousDeployment: false,
  localSchemaGeneration: true,
  localMigrationGeneration: true,
  cloudSandboxGeneration: true,
  cloudSandboxExecutionWithExplicitCredentials: true,
} as const;

export function decideBuilderRequest(request: BuilderRequest): BuilderDecision {
  const reasons: string[] = [];
  if (request.target === 'PRODUCTION') {
    reasons.push('production execution requires explicit human approval and a separate deployment workflow');
    return { allowed: false, executionMode: 'BLOCKED', reasons };
  }
  if (request.destructive) {
    reasons.push('destructive changes are generate-only until reviewed');
    return { allowed: true, executionMode: 'GENERATE_ONLY', reasons };
  }
  if (request.touchesProductionData) {
    reasons.push('production data access is not granted to autonomous builders');
    return { allowed: false, executionMode: 'BLOCKED', reasons };
  }
  if (request.target === 'LOCAL') {
    reasons.push('local/offline builders may generate schemas, migrations, tests, and architecture artifacts');
    return { allowed: true, executionMode: 'SANDBOX_EXECUTE', reasons };
  }
  reasons.push('cloud sandbox execution is permitted only with scoped credentials and isolated resources');
  return { allowed: true, executionMode: 'SANDBOX_EXECUTE', reasons };
}
