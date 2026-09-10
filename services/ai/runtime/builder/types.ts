export type BuilderProvider = 'OLLAMA' | 'GROK' | 'CHATGPT' | 'GEMINI' | 'LOCAL_RULES';
export type BuildTarget = 'LOCAL' | 'CLOUD_SANDBOX' | 'PRODUCTION';
export type ArtifactKind = 'DATABASE_SCHEMA' | 'MIGRATION' | 'ARCHITECTURE' | 'INFRA_PLAN' | 'TEST_PLAN' | 'CODE_PATCH';

export interface BuilderRequest {
  requestId: string;
  provider: BuilderProvider;
  target: BuildTarget;
  artifactKind: ArtifactKind;
  objective: string;
  repositoryBranch: string;
  requiresNetwork: boolean;
  touchesProductionData: boolean;
  destructive: boolean;
}

export interface BuilderDecision {
  allowed: boolean;
  executionMode: 'GENERATE_ONLY' | 'SANDBOX_EXECUTE' | 'BLOCKED';
  reasons: string[];
}

export interface DatabaseBlueprint {
  name: string;
  engine: 'POSTGRES' | 'SQLITE' | 'VECTOR' | 'GRAPH' | 'OBJECT_STORE';
  purpose: string;
  tablesOrCollections: string[];
  region?: string;
  offlineCapable: boolean;
  productionReady: boolean;
}
