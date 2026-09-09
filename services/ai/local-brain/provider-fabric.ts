export type ProviderId = 'local' | 'aws' | 'azure' | 'gcp' | 'google_ai_studio' | 'starlink';
export type ProviderCapability = 'model_inference' | 'object_storage' | 'compute' | 'database' | 'network_transport';
export type ProviderState = 'AVAILABLE' | 'UNAVAILABLE';

export type ProviderSlot = {
  provider: ProviderId;
  capabilities: ProviderCapability[];
  state: ProviderState;
  configured: boolean;
  authorized: boolean;
  evidenceRefs: string[];
  notes: string;
};

const slots = new Map<ProviderId, ProviderSlot>([
  ['local', { provider: 'local', capabilities: ['model_inference','compute'], state: 'UNAVAILABLE', configured: false, authorized: false, evidenceRefs: [], notes: 'Requires local runtime verification.' }],
  ['aws', { provider: 'aws', capabilities: ['compute','object_storage','database'], state: 'UNAVAILABLE', configured: false, authorized: false, evidenceRefs: [], notes: 'No AWS capability is assumed from account/tool presence.' }],
  ['azure', { provider: 'azure', capabilities: ['compute','object_storage','database','model_inference'], state: 'UNAVAILABLE', configured: false, authorized: false, evidenceRefs: [], notes: 'Requires explicit configuration and evidence.' }],
  ['gcp', { provider: 'gcp', capabilities: ['compute','object_storage','database','model_inference'], state: 'UNAVAILABLE', configured: false, authorized: false, evidenceRefs: [], notes: 'Requires explicit configuration and evidence.' }],
  ['google_ai_studio', { provider: 'google_ai_studio', capabilities: ['model_inference'], state: 'UNAVAILABLE', configured: false, authorized: false, evidenceRefs: [], notes: 'Gemini/AI Studio model access must be separately configured and verified.' }],
  ['starlink', { provider: 'starlink', capabilities: ['network_transport'], state: 'UNAVAILABLE', configured: false, authorized: false, evidenceRefs: [], notes: 'Starlink is modeled only as network transport, not compute or an AI provider.' }],
]);

export function providerSlots() { return [...slots.values()].map((slot) => ({ ...slot, capabilities: [...slot.capabilities], evidenceRefs: [...slot.evidenceRefs] })); }

export function registerVerifiedProvider(input: Omit<ProviderSlot, 'state'>) {
  const state: ProviderState = input.configured && input.authorized && input.evidenceRefs.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE';
  const slot: ProviderSlot = { ...input, capabilities: [...input.capabilities], evidenceRefs: [...input.evidenceRefs], state };
  slots.set(input.provider, slot);
  return slot;
}
