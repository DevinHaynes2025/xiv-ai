/**
 * 62L-DQ Enterprise Data Translation Grid —
 * Schema translation + field-level classification + data-movement previews.
 * Schema drift → quarantine. Sealed/local-only cannot silently cross providers/Universes.
 * Consequential classified-field moves require preview (else DENIED).
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DATA_MOVEMENT_PREVIEW_REQUIRED,
  DQ_LOCKS,
  MAX_TRANSLATION_SCHEMAS,
  SCHEMA_DRIFT_QUARANTINED,
  SEALED_CROSS_MOVE_DENIED,
  type DqActor,
  type FieldClassification,
} from './universal-integration-brain-types';

export type TranslationSchema = {
  id: string;
  name: string;
  version: string;
  schemaVersion: string;
  expectedSchemaVersion: string;
  fields: Array<{ name: string; classification: FieldClassification }>;
  quarantined: boolean;
  trusted: boolean;
  reason: string;
  createdAt: string;
};

export type DataMovementRequest = {
  id: string;
  schemaId: string;
  fieldName: string;
  classification: FieldClassification;
  fromProvider: string;
  toProvider: string;
  fromUniverse: string;
  toUniverse: string;
  previewPresented: boolean;
  consequential: boolean;
  status: 'allowed' | 'denied' | 'preview_required' | 'quarantined';
  reason: string;
  at: string;
};

type Store = {
  schemas: TranslationSchema[];
  movements: DataMovementRequest[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'enterprise-data-translation-grid.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { schemas: [], movements: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enterpriseDataTranslationGridHonesty() {
  return {
    schemaDriftSilentContinue: DQ_LOCKS.SCHEMA_DRIFT_SILENT_CONTINUE,
    schemaDriftQuarantines: DQ_LOCKS.SCHEMA_DRIFT_QUARANTINES,
    sealedSilentCrossProvider: DQ_LOCKS.SEALED_SILENT_CROSS_PROVIDER_MOVE,
    sealedSilentCrossUniverse: DQ_LOCKS.SEALED_SILENT_CROSS_UNIVERSE_MOVE,
    dataMovementWithoutPreview: DQ_LOCKS.DATA_MOVEMENT_WITHOUT_PREVIEW,
    classifiedFieldMoveRequiresPreview: DQ_LOCKS.CLASSIFIED_FIELD_MOVE_REQUIRES_PREVIEW,
  };
}

export async function registerTranslationSchema(input: {
  name: string;
  version: string;
  schemaVersion: string;
  fields: Array<{ name: string; classification: FieldClassification }>;
  root: string;
  actor: DqActor;
}): Promise<TranslationSchema> {
  const store = await load(input.root);
  void input.actor;
  if (store.schemas.length >= MAX_TRANSLATION_SCHEMAS) {
    throw new Error('MAX_TRANSLATION_SCHEMAS');
  }
  const schema: TranslationSchema = {
    id: id('dqschema'),
    name: input.name.trim(),
    version: input.version.trim(),
    schemaVersion: input.schemaVersion.trim(),
    expectedSchemaVersion: input.schemaVersion.trim(),
    fields: input.fields,
    quarantined: false,
    trusted: true,
    reason: 'TRANSLATION_SCHEMA_REGISTERED',
    createdAt: new Date().toISOString(),
  };
  store.schemas.push(schema);
  await save(input.root, store);
  return schema;
}

export async function reportTranslationSchemaDrift(input: {
  schemaId: string;
  observedSchemaVersion: string;
  root: string;
  actor: DqActor;
}): Promise<TranslationSchema> {
  const store = await load(input.root);
  void input.actor;
  const schema = store.schemas.find((s) => s.id === input.schemaId);
  if (!schema) throw new Error('SCHEMA_NOT_FOUND');
  if (input.observedSchemaVersion !== schema.expectedSchemaVersion) {
    schema.quarantined = true;
    schema.trusted = false;
    schema.reason = SCHEMA_DRIFT_QUARANTINED;
  }
  await save(input.root, store);
  return schema;
}

export async function requestDataMovement(input: {
  schemaId: string;
  fieldName: string;
  fromProvider: string;
  toProvider: string;
  fromUniverse: string;
  toUniverse: string;
  previewPresented?: boolean;
  consequential?: boolean;
  root: string;
  actor: DqActor;
}): Promise<DataMovementRequest> {
  const store = await load(input.root);
  void input.actor;
  const schema = store.schemas.find((s) => s.id === input.schemaId);
  const field = schema?.fields.find((f) => f.name === input.fieldName);
  const classification = field?.classification ?? 'internal';
  const crossProvider = input.fromProvider !== input.toProvider;
  const crossUniverse = input.fromUniverse !== input.toUniverse;
  const sealedOrLocal =
    classification === 'sealed' || classification === 'local_only';
  const consequential =
    input.consequential === true ||
    classification === 'confidential' ||
    classification === 'pii' ||
    classification === 'regulated' ||
    sealedOrLocal;
  const preview = input.previewPresented === true;
  const now = new Date().toISOString();

  let status: DataMovementRequest['status'] = 'allowed';
  let reason = 'DATA_MOVEMENT_ALLOWED';

  if (!schema || schema.quarantined || !schema.trusted) {
    status = 'quarantined';
    reason = SCHEMA_DRIFT_QUARANTINED;
  } else if (sealedOrLocal && (crossProvider || crossUniverse) && !preview) {
    // Silent sealed/local-only cross move denied
    status = 'denied';
    reason = SEALED_CROSS_MOVE_DENIED;
  } else if (consequential && !preview) {
    status = 'denied';
    reason = DATA_MOVEMENT_PREVIEW_REQUIRED;
  } else if (sealedOrLocal && (crossProvider || crossUniverse) && preview) {
    // Even with preview, silent sealed moves stay denied without explicit non-silent path;
    // preview alone does not authorize silent sealed cross-universe/provider moves.
    status = 'denied';
    reason = SEALED_CROSS_MOVE_DENIED;
  }

  const movement: DataMovementRequest = {
    id: id('dqmove'),
    schemaId: input.schemaId,
    fieldName: input.fieldName,
    classification,
    fromProvider: input.fromProvider,
    toProvider: input.toProvider,
    fromUniverse: input.fromUniverse,
    toUniverse: input.toUniverse,
    previewPresented: preview,
    consequential,
    status,
    reason,
    at: now,
  };
  store.movements.push(movement);
  await save(input.root, store);
  return movement;
}
