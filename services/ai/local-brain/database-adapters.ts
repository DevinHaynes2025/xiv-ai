import { evaluateOfflineTask } from './offline-policy';
import { INTEGRATION_ADAPTER_IDS, type IntegrationAdapterId } from './information-supply-chain-types';

export type AdapterObservation = {
  adapter: IntegrationAdapterId;
  detected: boolean;
  configured: boolean;
  authenticated: boolean;
  authorized: boolean;
  runtimeVerified: boolean;
  evidenceRefs: string[];
  notes: string;
};

export type AdapterSlot = AdapterObservation & {
  state: 'AVAILABLE' | 'UNAVAILABLE';
  partnershipClaimed: false;
};

const DEFAULT_NOTES: Record<IntegrationAdapterId, string> = {
  aws: 'AWS remains UNAVAILABLE until configured, authenticated, and runtime-verified. No partnership is claimed.',
  azure: 'Azure remains UNAVAILABLE until configured, authenticated, and runtime-verified. No partnership is claimed.',
  google_cloud: 'Google Cloud remains UNAVAILABLE until configured, authenticated, and runtime-verified. No partnership is claimed.',
  github: 'GitHub remains UNAVAILABLE until configured, authenticated, and runtime-verified. Issue API 403 is not a partnership.',
  gitlab: 'GitLab remains UNAVAILABLE until configured, authenticated, and runtime-verified. No partnership is claimed.',
  supabase_postgres: 'Supabase/Postgres remains UNAVAILABLE until configured, authenticated, and runtime-verified. No production writes.',
  snowflake: 'Snowflake remains UNAVAILABLE until configured, authenticated, and runtime-verified. No partnership is claimed.',
  databricks: 'Databricks remains UNAVAILABLE until configured, authenticated, and runtime-verified. No partnership is claimed.',
  local_agentic: 'Local agentic database is a logical sandbox store, not a production database.',
  local_knowledge_lake: 'Local Knowledge Lake holds sparse catalog objects. It is not a centralized world warehouse.',
};

const observations = new Map<IntegrationAdapterId, AdapterObservation>();

function defaultObservation(adapter: IntegrationAdapterId): AdapterObservation {
  const local = adapter === 'local_agentic' || adapter === 'local_knowledge_lake';
  return {
    adapter,
    detected: local,
    configured: local,
    authenticated: local,
    authorized: local,
    runtimeVerified: local,
    evidenceRefs: local ? [`62L-AM:local:${adapter}`] : [],
    notes: DEFAULT_NOTES[adapter],
  };
}

function resetObservations() {
  observations.clear();
  for (const adapter of INTEGRATION_ADAPTER_IDS) {
    observations.set(adapter, defaultObservation(adapter));
  }
}

resetObservations();

export function adapterAvailability(observation: AdapterObservation): 'AVAILABLE' | 'UNAVAILABLE' {
  if (
    observation.detected &&
    observation.configured &&
    observation.authenticated &&
    observation.authorized &&
    observation.runtimeVerified &&
    observation.evidenceRefs.length > 0
  ) {
    return 'AVAILABLE';
  }
  return 'UNAVAILABLE';
}

export function observeIntegrationAdapter(input: AdapterObservation) {
  observations.set(input.adapter, {
    ...input,
    evidenceRefs: [...input.evidenceRefs],
    notes: input.notes || DEFAULT_NOTES[input.adapter],
  });
  return describeIntegrationAdapter(input.adapter);
}

export function describeIntegrationAdapter(adapter: IntegrationAdapterId): AdapterSlot {
  const observation = observations.get(adapter) ?? defaultObservation(adapter);
  return {
    ...observation,
    evidenceRefs: [...observation.evidenceRefs],
    state: adapterAvailability(observation),
    partnershipClaimed: false,
  };
}

export function integrationAdapterSlots(): AdapterSlot[] {
  return INTEGRATION_ADAPTER_IDS.map(describeIntegrationAdapter);
}

export function resetIntegrationAdapters() {
  resetObservations();
}

export type QueryPlan =
  | {
      accepted: true;
      strategy: 'query_to_data' | 'federated_in_place' | 'hold_sealed';
      movementBytes: 0;
      copyAllToOnePlace: false;
      adaptersUsed: IntegrationAdapterId[];
      unavailableAdapters: IntegrationAdapterId[];
      sealedNonMovement: boolean;
      reason: string;
    }
  | {
      accepted: false;
      strategy: 'denied_centralization' | 'unavailable' | 'denied_sealed_movement';
      movementBytes: 0;
      copyAllToOnePlace: false;
      adaptersUsed: IntegrationAdapterId[];
      unavailableAdapters: IntegrationAdapterId[];
      sealedNonMovement: boolean;
      reason: string;
    };

export function planCrossDatabaseQuery(input: {
  query: string;
  neededStores: IntegrationAdapterId[];
  sealed?: boolean;
  copyAllToOnePlace?: boolean;
  destination?: IntegrationAdapterId;
}): QueryPlan {
  const slots = integrationAdapterSlots();
  const unavailable = slots.filter((slot) => slot.state === 'UNAVAILABLE').map((slot) => slot.adapter);
  const availableNeeded = input.neededStores.filter((id) => describeIntegrationAdapter(id).state === 'AVAILABLE');
  const unavailableNeeded = input.neededStores.filter((id) => describeIntegrationAdapter(id).state === 'UNAVAILABLE');

  if (input.sealed) {
    return {
      accepted: false,
      strategy: 'denied_sealed_movement',
      movementBytes: 0,
      copyAllToOnePlace: false,
      adaptersUsed: [],
      unavailableAdapters: unavailable,
      sealedNonMovement: true,
      reason: 'CEO-sealed records stay outside ordinary sync/movement. Query-to-data does not copy sealed payloads.',
    };
  }

  if (input.copyAllToOnePlace) {
    return {
      accepted: false,
      strategy: 'denied_centralization',
      movementBytes: 0,
      copyAllToOnePlace: false,
      adaptersUsed: [],
      unavailableAdapters: unavailable,
      sealedNonMovement: false,
      reason: 'Brute-force centralization of all data into one place is refused. Query-to-data / minimize movement is required.',
    };
  }

  if (input.destination && describeIntegrationAdapter(input.destination).state === 'UNAVAILABLE') {
    return {
      accepted: false,
      strategy: 'unavailable',
      movementBytes: 0,
      copyAllToOnePlace: false,
      adaptersUsed: [],
      unavailableAdapters: unavailableNeeded.concat(input.destination).filter((id, index, all) => all.indexOf(id) === index),
      sealedNonMovement: false,
      reason: `${input.destination} is UNAVAILABLE until configured, authenticated, and runtime-verified. No partnership is claimed.`,
    };
  }

  if (unavailableNeeded.length && availableNeeded.length === 0) {
    return {
      accepted: false,
      strategy: 'unavailable',
      movementBytes: 0,
      copyAllToOnePlace: false,
      adaptersUsed: [],
      unavailableAdapters: unavailableNeeded,
      sealedNonMovement: false,
      reason: 'Needed stores are unconfigured. Local work may continue; remote adapters stay UNAVAILABLE.',
    };
  }

  const offline = evaluateOfflineTask({
    needsInternet: unavailableNeeded.length > 0,
    needsCloudProvider: unavailableNeeded.some((id) => ['aws', 'azure', 'google_cloud', 'snowflake', 'databricks'].includes(id)),
    needsExternalFreshness: false,
    needsProductionWrite: false,
    needsPermissionChange: false,
    classification: 'internal',
  });

  if (!offline.allowed && unavailableNeeded.length && availableNeeded.length === 0) {
    return {
      accepted: false,
      strategy: 'unavailable',
      movementBytes: 0,
      copyAllToOnePlace: false,
      adaptersUsed: [],
      unavailableAdapters: unavailableNeeded,
      sealedNonMovement: false,
      reason: offline.reason,
    };
  }

  return {
    accepted: true,
    strategy: availableNeeded.length > 1 ? 'federated_in_place' : 'query_to_data',
    movementBytes: 0,
    copyAllToOnePlace: false,
    adaptersUsed: availableNeeded,
    unavailableAdapters: unavailableNeeded,
    sealedNonMovement: false,
    reason: `Query '${input.query.trim()}' is planned against in-place stores ${availableNeeded.join(', ') || 'local'}. Data is not copied into a central warehouse.`,
  };
}
