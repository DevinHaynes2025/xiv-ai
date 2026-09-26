import {
  XVI_TRANSFORMERS,
  type XviTransformerId,
  type XviBrainId,
} from './xvi-transformer-registry';

export type XviTransformerRuntimeState =
  | 'OFFLINE'
  | 'READY'
  | 'REASONING'
  | 'SIMULATING'
  | 'WAITING_APPROVAL'
  | 'DEGRADED';

export interface XviTransformerStatus {
  version: 'xvi-transformer-status-v1';

  transformerId: XviTransformerId;
  brainId: XviBrainId;

  state: XviTransformerRuntimeState;

  activeTasks: number;
  scenarioBranches: number;

  modelConnected: boolean;

  externalActionAuthority: false;
  credentialAccess: false;
  productionAuthority: false;
}

const refuse = (): never => {
  throw new Error(
    'XVI_TRANSFORMER_STATUS_REFUSED',
  );
};

export function createXviTransformerStatus(
  transformerId: XviTransformerId,
  state: XviTransformerRuntimeState,
  activeTasks: number,
  scenarioBranches: number,
  modelConnected: boolean,
): Readonly<XviTransformerStatus> {
  const definition =
    XVI_TRANSFORMERS.find(
      item =>
        item.transformerId ===
          transformerId,
    );

  if (!definition) {
    refuse();
  }

  if (
    ![
      'OFFLINE',
      'READY',
      'REASONING',
      'SIMULATING',
      'WAITING_APPROVAL',
      'DEGRADED',
    ].includes(state)
  ) {
    refuse();
  }

  if (
    !Number.isSafeInteger(activeTasks) ||
    activeTasks < 0 ||
    activeTasks > 1_000_000 ||
    !Number.isSafeInteger(
      scenarioBranches,
    ) ||
    scenarioBranches < 0 ||
    scenarioBranches > 1_000_000_000 ||
    typeof modelConnected !== 'boolean'
  ) {
    refuse();
  }

  return Object.freeze({
    version:
      'xvi-transformer-status-v1' as const,

    transformerId:
      definition.transformerId,

    brainId:
      definition.brainId,

    state,

    activeTasks,
    scenarioBranches,
    modelConnected,

    externalActionAuthority:
      false as const,

    credentialAccess:
      false as const,

    productionAuthority:
      false as const,
  });
}
