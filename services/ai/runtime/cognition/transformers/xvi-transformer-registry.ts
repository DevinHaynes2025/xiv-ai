export type XviTransformerId =
  | 'MACRO_TRANSFORMER'
  | 'FINANCIAL_TRANSFORMER'
  | 'COMPANY_TRANSFORMER'
  | 'HEALTH_TRANSFORMER'
  | 'MENTAL_HEALTH_TRANSFORMER'
  | 'GOVERNMENT_TRANSFORMER'
  | 'CODE_TRANSFORMER'
  | 'SCIENCE_TRANSFORMER'
  | 'SUPPLY_CHAIN_TRANSFORMER'
  | 'GEOSPATIAL_TRANSFORMER'
  | 'TECHNOLOGY_TRANSFORMER'
  | 'GOVERNANCE_TRANSFORMER';

export type XviBrainId =
  | 'MACRO'
  | 'FINANCIAL'
  | 'COMPANY'
  | 'HEALTH'
  | 'MENTAL_HEALTH'
  | 'GOVERNMENT'
  | 'CODE'
  | 'SCIENCE'
  | 'SUPPLY_CHAIN'
  | 'GEOSPATIAL'
  | 'TECHNOLOGY'
  | 'GOVERNANCE';

export interface XviTransformerDefinition {
  transformerId: XviTransformerId;
  brainId: XviBrainId;

  canReason: true;
  canSimulate: true;

  canSelfReplicateAuthority: false;
  canCopyCredentials: false;
  canEscalatePermissions: false;

  externalActionsRequireApproval: true;
  productionAuthority: false;
}

function definition(
  transformerId: XviTransformerId,
  brainId: XviBrainId,
): Readonly<XviTransformerDefinition> {
  return Object.freeze({
    transformerId,
    brainId,

    canReason: true,
    canSimulate: true,

    canSelfReplicateAuthority: false,
    canCopyCredentials: false,
    canEscalatePermissions: false,

    externalActionsRequireApproval: true,
    productionAuthority: false,
  });
}

export const XVI_TRANSFORMERS =
  Object.freeze([
    definition('MACRO_TRANSFORMER', 'MACRO'),
    definition('FINANCIAL_TRANSFORMER', 'FINANCIAL'),
    definition('COMPANY_TRANSFORMER', 'COMPANY'),
    definition('HEALTH_TRANSFORMER', 'HEALTH'),
    definition('MENTAL_HEALTH_TRANSFORMER', 'MENTAL_HEALTH'),
    definition('GOVERNMENT_TRANSFORMER', 'GOVERNMENT'),
    definition('CODE_TRANSFORMER', 'CODE'),
    definition('SCIENCE_TRANSFORMER', 'SCIENCE'),
    definition('SUPPLY_CHAIN_TRANSFORMER', 'SUPPLY_CHAIN'),
    definition('GEOSPATIAL_TRANSFORMER', 'GEOSPATIAL'),
    definition('TECHNOLOGY_TRANSFORMER', 'TECHNOLOGY'),
    definition('GOVERNANCE_TRANSFORMER', 'GOVERNANCE'),
  ]);

export const XVI_TRANSFORMER_COUNT =
  XVI_TRANSFORMERS.length;

if (XVI_TRANSFORMER_COUNT !== 12) {
  throw new Error(
    'XVI_TRANSFORMER_REGISTRY_INVALID',
  );
}
