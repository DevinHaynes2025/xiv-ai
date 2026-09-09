import type { AuditLedger } from './audit';
import type { Clock } from './clock';
import { RuntimeError } from './errors';
import type { RuntimeAdapter } from './hardware';
import type { IdFactory } from './ids';
import type {
  ModelInvocationRecord,
  ModelRegistryEntry,
  TenantRef,
  WorkloadClassification,
} from './types';

export type ModelUsage = {
  tokensIn: number;
  tokensOut: number;
};

/**
 * Approved-model registry (AC-14).
 *
 * There is no default model and no fallback model. A workload that names an
 * unregistered, unapproved, ungated or unconfigured model is refused, and the
 * refusal reason is distinct in each case so the acceptance suite can count
 * them separately.
 */
export class ModelRegistry {
  private readonly entries = new Map<string, ModelRegistryEntry>();
  private readonly invocations: ModelInvocationRecord[] = [];

  constructor(
    private readonly clock: Clock,
    private readonly ids: IdFactory,
    private readonly audit: AuditLedger,
  ) {}

  register(entry: ModelRegistryEntry): ModelRegistryEntry {
    this.entries.set(entry.modelId, entry);
    this.audit.append({
      tenant: null,
      category: 'model',
      kind: 'model_registered',
      subjectId: entry.modelId,
      detail: {
        provider: entry.provider,
        approved: entry.approved,
        providerConfigured: entry.providerConfigured,
        evaluationGate: entry.evaluationGate?.evaluationId ?? null,
      },
    });
    return entry;
  }

  get(modelId: string): ModelRegistryEntry | undefined {
    return this.entries.get(modelId);
  }

  list(): ModelRegistryEntry[] {
    return [...this.entries.values()];
  }

  /** Availability is a fact about configuration, never an optimistic default. */
  availability(modelId: string): 'available' | 'unregistered' | 'unapproved' | 'ungated' | 'unavailable' {
    const entry = this.entries.get(modelId);
    if (!entry) return 'unregistered';
    if (!entry.approved) return 'unapproved';
    if (!entry.evaluationGate || !entry.evaluationGate.passed) return 'ungated';
    if (!entry.providerConfigured) return 'unavailable';
    return 'available';
  }

  authorize(input: {
    modelId: string;
    tenant: TenantRef;
    classification: WorkloadClassification;
    workloadId: string;
  }): ModelRegistryEntry {
    const state = this.availability(input.modelId);
    if (state !== 'available') {
      const code =
        state === 'unregistered'
          ? 'model_unregistered'
          : state === 'unapproved' || state === 'ungated'
            ? 'model_unapproved'
            : 'model_unavailable';
      this.audit.append({
        tenant: input.tenant,
        category: 'security',
        kind: 'model_invocation_blocked',
        subjectId: input.workloadId,
        detail: { modelId: input.modelId, state },
      });
      throw new RuntimeError(code, 'This model may not be invoked.', { modelId: input.modelId, state });
    }
    const entry = this.entries.get(input.modelId) as ModelRegistryEntry;
    if (!entry.classifications.includes(input.classification)) {
      this.audit.append({
        tenant: input.tenant,
        category: 'security',
        kind: 'model_invocation_blocked',
        subjectId: input.workloadId,
        detail: { modelId: input.modelId, state: 'classification_not_permitted' },
      });
      throw new RuntimeError('model_unapproved', 'This model is not approved for that classification.', {
        modelId: input.modelId,
        classification: input.classification,
      });
    }
    return entry;
  }

  /**
   * Binds the authorized model to the runtime that will execute it. If the
   * adapter hands back a different model id, that is a substitution and it is
   * rejected instead of being logged and continued.
   */
  bindToRuntime(entry: ModelRegistryEntry, adapter: RuntimeAdapter): string {
    const resolved = adapter.resolveModel(entry.modelId);
    if (resolved !== entry.modelId) {
      this.audit.append({
        tenant: null,
        category: 'security',
        kind: 'model_substitution_blocked',
        subjectId: entry.modelId,
        detail: { requested: entry.modelId, resolved, classId: adapter.classId },
      });
      throw new RuntimeError('model_substitution', 'The runtime attempted to substitute a different model.', {
        requested: entry.modelId,
        resolved,
      });
    }
    return resolved;
  }

  recordInvocation(input: {
    workloadId: string;
    entry: ModelRegistryEntry;
    tenant: TenantRef;
    nodeId: string;
    usage: ModelUsage;
  }): ModelInvocationRecord {
    const costAttributable = input.entry.costPerKTokenUsd !== null;
    const totalTokens = input.usage.tokensIn + input.usage.tokensOut;
    const record: ModelInvocationRecord = {
      invocationId: this.ids.mint('minv'),
      workloadId: input.workloadId,
      modelId: input.entry.modelId,
      provider: input.entry.provider,
      tenant: input.tenant,
      nodeId: input.nodeId,
      tokensIn: input.usage.tokensIn,
      tokensOut: input.usage.tokensOut,
      costUsd: costAttributable ? (totalTokens / 1000) * (input.entry.costPerKTokenUsd as number) : null,
      costAttributable,
      at: this.clock.now(),
    };
    this.invocations.push(record);
    this.audit.append({
      tenant: input.tenant,
      category: 'model',
      kind: 'model_invoked',
      subjectId: input.workloadId,
      detail: {
        modelId: record.modelId,
        invocationId: record.invocationId,
        tokens: totalTokens,
        costUsd: record.costUsd,
      },
    });
    return record;
  }

  invocationsFor(workloadId: string): ModelInvocationRecord[] {
    return this.invocations.filter((record) => record.workloadId === workloadId);
  }

  allInvocations(): readonly ModelInvocationRecord[] {
    return this.invocations;
  }

  export() {
    return {
      entries: Object.fromEntries(this.entries.entries()),
      invocations: [...this.invocations],
    };
  }
}

/**
 * Provider configuration is read from the environment. A missing key means the
 * provider is UNAVAILABLE; it never means "assume it works".
 */
export function providerConfigured(provider: string, env: NodeJS.ProcessEnv = process.env): boolean {
  switch (provider) {
    case 'xiv_local':
      return true;
    case 'gemini':
      return Boolean((env.GEMINI_API_KEY ?? env.GOOGLE_API_KEY ?? '').trim());
    case 'openai':
      return Boolean((env.OPENAI_API_KEY ?? '').trim());
    case 'anthropic':
      return Boolean((env.ANTHROPIC_API_KEY ?? '').trim());
    default:
      return false;
  }
}
