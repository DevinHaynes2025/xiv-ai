import { listSharedToolCapabilities, requestSharedTool, advertiseToolCapability, type SharedToolCapability } from './tool-capability-exchange';
import { providerSlots } from './provider-fabric';

export type ToolModelRegistryEntry = {
  id: string;
  kind: 'tool' | 'model';
  state: 'AVAILABLE' | 'UNAVAILABLE';
  locality: 'local' | 'cloud';
  configured: boolean;
  authorized: boolean;
  evidenceRefs: string[];
  notes: string;
};

export function listToolModelRegistry(): ToolModelRegistryEntry[] {
  const tools = listSharedToolCapabilities().map((tool) => ({
    id: tool.id,
    kind: tool.kind === 'model' ? 'model' as const : 'tool' as const,
    state: tool.state,
    locality: 'local' as const,
    configured: tool.configured,
    authorized: tool.authorized,
    evidenceRefs: [...tool.evidenceRefs],
    notes: tool.notes,
  }));
  const providers = providerSlots().map((slot) => ({
    id: `provider:${slot.provider}`,
    kind: slot.capabilities.includes('model_inference') ? 'model' as const : 'tool' as const,
    state: slot.state,
    locality: slot.provider === 'local' ? 'local' as const : 'cloud' as const,
    configured: slot.configured,
    authorized: slot.authorized,
    evidenceRefs: [...slot.evidenceRefs],
    notes: slot.notes,
  }));
  return [...tools, ...providers];
}

export function resolveToolOrModel(id: string) {
  const shared = requestSharedTool(id);
  if (shared.tool) return { source: 'tool-mesh' as const, ...shared };
  const entry = listToolModelRegistry().find((item) => item.id === id);
  if (!entry) return { source: 'registry' as const, state: 'UNAVAILABLE' as const, reason: 'Unknown tool/model.', entry: null };
  return {
    source: 'registry' as const,
    state: entry.state,
    reason: entry.state === 'AVAILABLE' ? 'Configured and evidenced.' : entry.notes,
    entry,
  };
}

export function registerLocalTool(input: Omit<SharedToolCapability, 'state'>) {
  return advertiseToolCapability(input);
}

export function cloudModelsRemainUnavailable() {
  return listToolModelRegistry()
    .filter((entry) => entry.locality === 'cloud')
    .every((entry) => entry.configured && entry.authorized && entry.evidenceRefs.length > 0 ? entry.state === 'AVAILABLE' : entry.state === 'UNAVAILABLE');
}
