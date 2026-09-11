export const OLLAMA_LOCAL_ENDPOINT = 'http://127.0.0.1:11434' as const;

export interface OllamaModelInfo {
  name: string;
  modifiedAt?: string;
  size?: number;
}

export interface OllamaRuntimeReceipt {
  endpoint: typeof OLLAMA_LOCAL_ENDPOINT;
  reachable: boolean;
  verifiedAt: string;
  modelNames: readonly string[];
  preferredModel?: string;
  evidenceRef: string;
  localOnly: true;
  productionAuthority: false;
  cloudExecutionVerified: false;
}

export const OLLAMA_RUNTIME_GUARDRAILS = {
  loopbackOnly: true,
  localOnly: true,
  productionAuthority: false,
  autonomousDeployAllowed: false,
  modelWeightMutationAllowed: false,
  preferredModels: Object.freeze(['qwen2.5-coder:7b', 'gpt-oss:20b']),
} as const;

export function selectPreferredOllamaModel(modelNames: readonly string[]): string | undefined {
  for (const preferred of OLLAMA_RUNTIME_GUARDRAILS.preferredModels) {
    if (modelNames.includes(preferred)) return preferred;
  }
  return modelNames[0];
}

export function buildOllamaRuntimeReceipt(input: {
  reachable: boolean;
  verifiedAt: string;
  modelNames: readonly string[];
  evidenceRef: string;
}): OllamaRuntimeReceipt {
  if (!input.verifiedAt || !input.evidenceRef) throw new Error('verification timestamp and evidence reference required');
  const modelNames = Object.freeze([...new Set(input.modelNames.filter(Boolean))]);
  return Object.freeze({
    endpoint: OLLAMA_LOCAL_ENDPOINT,
    reachable: input.reachable,
    verifiedAt: input.verifiedAt,
    modelNames,
    preferredModel: input.reachable ? selectPreferredOllamaModel(modelNames) : undefined,
    evidenceRef: input.evidenceRef,
    localOnly: true,
    productionAuthority: false,
    cloudExecutionVerified: false,
  });
}

export function canUseOllamaForLocalBrain(receipt: OllamaRuntimeReceipt): boolean {
  return receipt.endpoint === OLLAMA_LOCAL_ENDPOINT && receipt.reachable && receipt.localOnly && !receipt.productionAuthority;
}
