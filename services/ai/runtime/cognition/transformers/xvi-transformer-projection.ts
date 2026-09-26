import {
  XVI_TRANSFORMERS,
} from './xvi-transformer-registry';

import {
  createXviTransformerStatus,
  type XviTransformerRuntimeState,
} from './xvi-transformer-status';

export interface XviTransformerProjection {
  version:
    'xvi-transformer-projection-v1';

  transformerCount: 12;

  transformers:
    readonly ReturnType<
      typeof createXviTransformerStatus
    >[];

  frontendSafe: true;
  secretMaterialIncluded: false;
  productionAuthority: false;
}

export function createXviTransformerProjection():
  Readonly<XviTransformerProjection> {
  const transformers =
    XVI_TRANSFORMERS.map(
      transformer =>
        createXviTransformerStatus(
          transformer.transformerId,
          'OFFLINE' as
            XviTransformerRuntimeState,
          0,
          0,
          false,
        ),
    );

  if (transformers.length !== 12) {
    throw new Error(
      'XVI_TRANSFORMER_PROJECTION_REFUSED',
    );
  }

  return Object.freeze({
    version:
      'xvi-transformer-projection-v1' as const,

    transformerCount:
      12 as const,

    transformers:
      Object.freeze(transformers),

    frontendSafe:
      true as const,

    secretMaterialIncluded:
      false as const,

    productionAuthority:
      false as const,
  });
}
