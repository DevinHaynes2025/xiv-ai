/**
 * Phase 2I-AC Data Nervous System barrel.
 * Authorized data lineage + information logistics — NOT surveillance.
 * Metadata where possible; no raw secrets/PII in audit.
 */

export type {
  CapabilityLifecycle,
  DataClassification,
  DataEventKind,
  DataFreshnessState,
  DataPurpose,
  DataQualityState,
  InformationLogisticsStage,
} from './types';
export {
  DATA_CLASSIFICATIONS,
  DATA_EVENT_KINDS,
  INFORMATION_LOGISTICS_STAGES,
} from './types';

export {
  createDataAsset,
  createDataMovement,
  emitDataEvent,
  evaluateDataAccess,
  listDataEventKinds,
  openDataAudit,
  recordSensitivePayloadForAudit,
} from './events';
export type {
  DataAccess,
  DataAsset,
  DataAudit,
  DataConsumer,
  DataEvent,
  DataFreshness,
  DataMovement,
  DataMutation,
  DataOwner,
  DataProducer,
  DataProvenance,
  DataQuality,
  DataRegion,
  DataRetention,
  DataTransformation,
} from './events';

export {
  authorizedLineageObservabilityEnabled,
  buildLineage,
  createDependency,
  evaluateLineagePurpose,
  lineageMayExposeRawSecrets,
  surveillanceTrackingAllowed,
  traverseLineage,
} from './lineage';
export type {
  DataDependency,
  DataLineage,
  DataLineageEdge,
  DataLineageNode,
  LineageTraversalAnswer,
} from './lineage';

export {
  advanceLogisticsStage,
  answerInformationLogisticsQuestion,
  answerLogisticsTraversal,
  createLogisticsNode,
  linkLogisticsNodes,
  listInformationLogisticsQuestions,
  listInformationLogisticsStages,
  openInformationLogisticsGraph,
  INFORMATION_LOGISTICS_QUESTIONS,
} from './logistics';
export type {
  InformationLogisticsGraph,
  InformationLogisticsQuestion,
  LogisticsEdge,
  LogisticsNode,
} from './logistics';

export {
  aiTrackingEveryMovementMeansAuthorizedLineage,
  aiTrackingEveryMovementMeansSurveillance,
  companyAutoPromotesToGlobal,
  metadataPreferredForAudit,
  moreDataMeansPermissionToUseIt,
  offlineEqualsAuthorized,
  openDataNervousGrounding,
  openDataNervousSystem,
  personalAutoPromotesToCompany,
  privateAutoPromotesToPublic,
  rawPiiPayloadsRecordedForAudit,
  rawSecretsRecordedForAudit,
  sourceRefsAndPermittedDerivedIntelligenceAllowed,
  wholesaleUnauthorizedCopyrightCopyingAllowed,
} from './grounding';
export type { DataNervousSystem } from './grounding';
