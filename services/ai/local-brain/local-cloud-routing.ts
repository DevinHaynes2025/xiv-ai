import { evaluateOfflineTask } from './offline-policy';
import { cloudToolRoutingDecision } from './tool-capability-exchange';
import { listToolModelRegistry, resolveToolOrModel } from './tool-model-registry';
import { createNeuralTransitEnvelope, type NeuralTransitEnvelope } from './neural-transit-envelope';

export type LocalCloudRouteDecision = {
  selected: 'local' | 'none';
  cloud: 'UNAVAILABLE';
  preferLocal: true;
  reason: string;
  envelope: NeuralTransitEnvelope | null;
  productionAuthorization: false;
};

export function routeLocalOrCloud(input: {
  tenantId: string;
  universeId: string;
  topic: string;
  body: string;
  prefer?: 'local' | 'cloud';
  modelId?: string;
}): LocalCloudRouteDecision {
  const cloud = cloudToolRoutingDecision();
  const prefer = input.prefer ?? 'local';

  if (prefer === 'cloud') {
    const offline = evaluateOfflineTask({
      needsInternet: false,
      needsCloudProvider: true,
      needsExternalFreshness: false,
      needsProductionWrite: false,
      needsPermissionChange: false,
      classification: 'internal',
    });
    return {
      selected: 'none',
      cloud: 'UNAVAILABLE',
      preferLocal: true,
      reason: `${offline.reason} Cloud remains UNAVAILABLE until configured, authorized, and verified.`,
      envelope: null,
      productionAuthorization: false,
    };
  }

  if (input.modelId) {
    const model = resolveToolOrModel(input.modelId);
    if (model.state !== 'AVAILABLE') {
      const created = createNeuralTransitEnvelope({
        tenantId: input.tenantId,
        universeId: input.universeId,
        from: { kind: 'agent', id: 'router' },
        to: { kind: 'model', id: input.modelId },
        topic: input.topic,
        body: input.body,
        partition: 'local',
      });
      return {
        selected: created.accepted ? 'local' : 'none',
        cloud: 'UNAVAILABLE',
        preferLocal: true,
        reason: `Requested model ${input.modelId} is UNAVAILABLE. Envelope may still travel locally.`,
        envelope: created.accepted ? created.envelope : null,
        productionAuthorization: false,
      };
    }
  }

  const created = createNeuralTransitEnvelope({
    tenantId: input.tenantId,
    universeId: input.universeId,
    from: { kind: 'agent', id: 'router' },
    to: { kind: 'tool', id: 'local_command_runner' },
    topic: input.topic,
    body: input.body,
    partition: 'local',
  });

  return {
    selected: created.accepted ? 'local' : 'none',
    cloud: 'UNAVAILABLE',
    preferLocal: true,
    reason: created.accepted ? cloud.reason : created.reason,
    envelope: created.accepted ? created.envelope : null,
    productionAuthorization: false,
  };
}

export function unconfiguredCloudSlots() {
  return listToolModelRegistry().filter((entry) => entry.locality === 'cloud' && entry.state === 'UNAVAILABLE');
}
