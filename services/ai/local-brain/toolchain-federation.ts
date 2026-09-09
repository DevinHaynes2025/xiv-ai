import { localModelStatus } from './local-model';
import { getRuntime, selectRuntime } from './hybrid-runtime';
import { providerSlots, registerVerifiedProvider, type ProviderState } from './provider-fabric';
import { evaluateOfflineTask } from './offline-policy';
import type { EvidenceState } from './evidence-promotion-gate';

export const TOOLCHAIN_ADAPTERS = [
  'cursor',
  'github',
  'gitlab',
  'supabase_sandbox_readonly',
  'local_models',
  'aws',
  'azure',
  'gcp',
  'google_ai_studio',
  'future_adapter',
] as const;

export type ToolchainAdapterId = (typeof TOOLCHAIN_ADAPTERS)[number];

export type ToolchainSlot = {
  adapter: ToolchainAdapterId;
  configured: boolean;
  authorized: boolean;
  runtimeEvidence: string[];
  state: ProviderState;
  access: 'read_only' | 'sandbox' | 'local' | 'none';
  notes: string;
};

const slots = new Map<ToolchainAdapterId, ToolchainSlot>();

function seed(adapter: ToolchainAdapterId, notes: string, access: ToolchainSlot['access'] = 'none'): ToolchainSlot {
  const slot: ToolchainSlot = {
    adapter,
    configured: false,
    authorized: false,
    runtimeEvidence: [],
    state: 'UNAVAILABLE',
    access,
    notes,
  };
  slots.set(adapter, slot);
  return slot;
}

seed('cursor', 'Cursor is a development surface, not a production authority.', 'sandbox');
seed('github', 'GitHub remote evidence requires configured auth plus a successful runtime probe.', 'read_only');
seed('gitlab', 'GitLab remote evidence requires configured auth plus a successful runtime probe.', 'read_only');
seed('supabase_sandbox_readonly', 'Supabase is sandbox/read-only here. No RLS/Guardian weakening. No production writes.', 'read_only');
seed('local_models', 'Local models become AVAILABLE only when XIV_LOCAL_MODEL is configured and the runtime is reachable.', 'local');
seed('aws', 'AWS remains UNAVAILABLE until configured, authorized, and evidenced.', 'none');
seed('azure', 'Azure remains UNAVAILABLE until configured, authorized, and evidenced.', 'none');
seed('gcp', 'GCP remains UNAVAILABLE until configured, authorized, and evidenced.', 'none');
seed('google_ai_studio', 'Google AI Studio / Gemini remains UNAVAILABLE until configured, authorized, and evidenced.', 'none');
seed('future_adapter', 'Future adapters are registered as UNAVAILABLE placeholders. Presence of a name is not capability.', 'none');

export function toolchainSlots(): ToolchainSlot[] {
  return [...slots.values()].map((slot) => ({ ...slot, runtimeEvidence: [...slot.runtimeEvidence] }));
}

export function registerToolchainAdapter(input: Omit<ToolchainSlot, 'state'>): ToolchainSlot {
  const state: ProviderState = input.configured && input.authorized && input.runtimeEvidence.length > 0
    ? 'AVAILABLE'
    : 'UNAVAILABLE';
  const slot: ToolchainSlot = {
    ...input,
    runtimeEvidence: [...input.runtimeEvidence],
    state,
  };
  slots.set(input.adapter, slot);
  return slot;
}

export async function probeLocalModelAdapter(): Promise<ToolchainSlot> {
  const status = await localModelStatus();
  const available = status.availability === 'AVAILABLE';
  return registerToolchainAdapter({
    adapter: 'local_models',
    configured: Boolean(status.model),
    authorized: available,
    runtimeEvidence: available ? [`ollama:${status.endpoint}:${status.model}`] : [],
    access: 'local',
    notes: status.reason,
  });
}

export function selectLocalFirstProvider(input: {
  online: boolean;
  classification: string;
  needsCloudProvider?: boolean;
  needsExternalFreshness?: boolean;
}): {
  selected: 'local' | null;
  reason: string;
  cloud: 'UNAVAILABLE' | 'WAITING_DATA';
  localRuntime: ReturnType<typeof getRuntime>;
} {
  const offline = evaluateOfflineTask({
    needsInternet: input.needsExternalFreshness === true,
    needsCloudProvider: input.needsCloudProvider === true,
    needsExternalFreshness: input.needsExternalFreshness === true,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: input.classification as 'public' | 'internal' | 'confidential' | 'restricted',
  });
  const local = getRuntime('local');
  const preferred = selectRuntime({
    online: input.online,
    classification: input.classification,
    preferred: ['local', 'gcp', 'azure', 'aws'],
  });
  if (!input.online || input.needsCloudProvider) {
    const cloudState = input.needsExternalFreshness ? 'WAITING_DATA' as const : 'UNAVAILABLE' as const;
    if (offline.allowed && local.state === 'AVAILABLE') {
      return { selected: 'local', reason: 'Local-first: local runtime is AVAILABLE and the task is locally executable.', cloud: cloudState, localRuntime: local };
    }
    return {
      selected: local.state === 'AVAILABLE' && offline.allowed ? 'local' : null,
      reason: offline.allowed ? 'Local runtime is not AVAILABLE; cloud remains unactivated.' : offline.reason,
      cloud: cloudState,
      localRuntime: local,
    };
  }
  if (preferred?.provider === 'local' && preferred.state === 'AVAILABLE') {
    return { selected: 'local', reason: 'Local-first selection chose the verified local runtime.', cloud: 'UNAVAILABLE', localRuntime: local };
  }
  if (preferred && preferred.provider !== 'local') {
    return {
      selected: null,
      reason: `Non-local runtime ${preferred.provider} is registered but AA will not silently activate cloud providers without founder-authorized evidence.`,
      cloud: 'UNAVAILABLE',
      localRuntime: local,
    };
  }
  return {
    selected: null,
    reason: 'No verified local provider is AVAILABLE.',
    cloud: 'UNAVAILABLE',
    localRuntime: local,
  };
}

export function providerFabricHonesty() {
  return {
    slots: providerSlots(),
    toolchain: toolchainSlots(),
    registerVerifiedProvider,
    inventedAvailability: false as const,
  };
}

export function evidenceStateForAdapter(slot: ToolchainSlot): EvidenceState {
  if (slot.state === 'AVAILABLE') return 'PASS';
  if (slot.adapter === 'github' || slot.adapter === 'gitlab' || slot.adapter === 'google_ai_studio') return 'WAITING_DATA';
  return 'UNAVAILABLE';
}
