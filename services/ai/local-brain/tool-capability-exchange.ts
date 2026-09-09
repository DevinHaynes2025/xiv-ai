import { providerSlots, registerVerifiedProvider, type ProviderCapability, type ProviderId, type ProviderSlot } from './provider-fabric';
import { evaluateOfflineTask } from './offline-policy';

export type SharedToolKind = 'local_command' | 'model' | 'knowledge' | 'ledger' | 'sandbox';

export type SharedToolCapability = {
  id: string;
  kind: SharedToolKind;
  label: string;
  owner: string;
  capabilities: ProviderCapability[];
  state: 'AVAILABLE' | 'UNAVAILABLE';
  configured: boolean;
  authorized: boolean;
  evidenceRefs: string[];
  notes: string;
};

const tools = new Map<string, SharedToolCapability>([
  ['local_command_runner', {
    id: 'local_command_runner',
    kind: 'local_command',
    label: 'Allowlisted local command runner',
    owner: 'local-brain',
    capabilities: ['compute'],
    state: 'AVAILABLE',
    configured: true,
    authorized: true,
    evidenceRefs: ['module:local-command-runner'],
    notes: 'Hardcoded allowlist only. Not arbitrary shell.',
  }],
  ['local_model', {
    id: 'local_model',
    kind: 'model',
    label: 'Configured local model',
    owner: 'local-brain',
    capabilities: ['model_inference'],
    state: 'UNAVAILABLE',
    configured: false,
    authorized: false,
    evidenceRefs: [],
    notes: 'UNAVAILABLE until XIV_LOCAL_MODEL is configured and verified.',
  }],
  ['context_vault', {
    id: 'context_vault',
    kind: 'knowledge',
    label: 'Context Vault',
    owner: 'local-brain',
    capabilities: ['object_storage'],
    state: 'AVAILABLE',
    configured: true,
    authorized: true,
    evidenceRefs: ['module:context-vault'],
    notes: 'Approved local repo paths only.',
  }],
]);

export function listSharedToolCapabilities() {
  return [...tools.values()].map((tool) => ({
    ...tool,
    capabilities: [...tool.capabilities],
    evidenceRefs: [...tool.evidenceRefs],
  }));
}

export function advertiseToolCapability(input: Omit<SharedToolCapability, 'state'>) {
  const state: SharedToolCapability['state'] =
    input.configured && input.authorized && input.evidenceRefs.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
  const tool: SharedToolCapability = {
    ...input,
    capabilities: [...input.capabilities],
    evidenceRefs: [...input.evidenceRefs],
    state,
  };
  tools.set(tool.id, tool);
  return tool;
}

export function requestSharedTool(id: string) {
  const tool = tools.get(id);
  if (!tool) return { state: 'UNAVAILABLE' as const, reason: 'Unknown tool capability.', tool: null };
  if (tool.state !== 'AVAILABLE') return { state: 'UNAVAILABLE' as const, reason: tool.notes, tool };
  return { state: 'AVAILABLE' as const, reason: 'Tool is locally configured and evidenced.', tool };
}

export function exchangeProviderCapabilities(): ProviderSlot[] {
  return providerSlots();
}

export function verifyProviderForExchange(input: Omit<ProviderSlot, 'state'> & { provider: ProviderId }) {
  return registerVerifiedProvider(input);
}

export function cloudToolRoutingDecision() {
  const offline = evaluateOfflineTask({
    needsInternet: false,
    needsCloudProvider: true,
    needsExternalFreshness: false,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });
  return {
    preferLocal: true as const,
    cloud: 'UNAVAILABLE' as const,
    reason: offline.reason,
    providers: providerSlots().map((slot) => ({
      provider: slot.provider,
      state: slot.state,
      configured: slot.configured,
    })),
  };
}

export function resetSharedToolCapabilities() {
  for (const [id, tool] of tools) {
    if (id === 'local_model' || (!tool.configured && tool.evidenceRefs.length === 0)) {
      tool.state = 'UNAVAILABLE';
    }
  }
}
