import { cortexId, readJsonFile, writeJsonFileAtomic, xivLocalPath } from './cortex-store';
import { getLakeObject, ingestLakeSource, type KnowledgeLakeObject } from './knowledge-lake';

export type TranslationState = 'AVAILABLE' | 'UNAVAILABLE' | 'WAITING_DATA';
export type TranslatorKind = 'human' | 'local_model' | 'UNAVAILABLE';

export type TranslationMetadata = {
  id: string;
  lakeObjectId: string;
  tenantId: string;
  universeId: string;
  targetLanguage: string;
  translatedText: string;
  translator: TranslatorKind;
  state: TranslationState;
  replacesOriginal: false;
  createdAt: string;
  productionAuthorization: false;
};

type TranslationStore = { translations: TranslationMetadata[] };

const MAX_TRANSLATIONS = 20_000;

function storePath(root: string) {
  return xivLocalPath(root, 'multilingual-sources.json');
}

async function load(root: string): Promise<TranslationMetadata[]> {
  const parsed = await readJsonFile<TranslationStore>(storePath(root), { translations: [] });
  return Array.isArray(parsed.translations) ? parsed.translations : [];
}

async function save(root: string, translations: TranslationMetadata[]) {
  await writeJsonFileAtomic(storePath(root), { translations: translations.slice(-MAX_TRANSLATIONS) });
}

export async function preserveOriginalSource(input: Parameters<typeof ingestLakeSource>[0]) {
  const ingested = await ingestLakeSource(input);
  return {
    ...ingested,
    originalPreserved: true as const,
    originalLanguage: ingested.object.sourceLanguage,
    originalText: ingested.object.originalText,
  };
}

export async function attachTranslationMetadata(input: {
  lakeObjectId: string;
  tenantId: string;
  universeId: string;
  targetLanguage: string;
  translatedText?: string;
  translator?: TranslatorKind;
  localModelConfigured?: boolean;
  needsExternalTranslator?: boolean;
  root?: string;
}): Promise<TranslationMetadata> {
  if (!input.tenantId || !input.universeId) throw new Error('TENANT_AND_UNIVERSE_REQUIRED');
  if (!input.targetLanguage.trim()) throw new Error('TRANSLATION_LANGUAGE_REQUIRED');
  const root = input.root ?? process.cwd();
  const source = await getLakeObject({
    id: input.lakeObjectId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  if (!source) throw new Error('LAKE_OBJECT_NOT_FOUND');

  let state: TranslationState = 'AVAILABLE';
  let translator: TranslatorKind = input.translator ?? 'human';
  let translatedText = (input.translatedText ?? '').trim();
  if (input.needsExternalTranslator) {
    state = 'WAITING_DATA';
    translator = 'UNAVAILABLE';
    translatedText = '';
  } else if (translator === 'local_model' && input.localModelConfigured === false) {
    state = 'UNAVAILABLE';
    translator = 'UNAVAILABLE';
    translatedText = '';
  } else if (!translatedText) {
    state = 'UNAVAILABLE';
    translator = 'UNAVAILABLE';
  }

  const record: TranslationMetadata = {
    id: cortexId('tr'),
    lakeObjectId: source.id,
    tenantId: input.tenantId,
    universeId: input.universeId,
    targetLanguage: input.targetLanguage.trim().toLowerCase(),
    translatedText,
    translator,
    state,
    replacesOriginal: false,
    createdAt: new Date().toISOString(),
    productionAuthorization: false,
  };
  const translations = await load(root);
  translations.push(record);
  await save(root, translations);
  return record;
}

export async function readPreservedSource(input: {
  lakeObjectId: string;
  tenantId: string;
  universeId: string;
  preferLanguage?: string;
  root?: string;
}): Promise<{
  original: KnowledgeLakeObject;
  originalText: string;
  originalLanguage: string;
  translation: TranslationMetadata | null;
  usedTranslation: false | true;
}> {
  const root = input.root ?? process.cwd();
  const original = await getLakeObject({
    id: input.lakeObjectId,
    tenantId: input.tenantId,
    universeId: input.universeId,
    root,
  });
  if (!original) throw new Error('LAKE_OBJECT_NOT_FOUND');
  const translations = await load(root);
  const preferLanguage = input.preferLanguage?.toLowerCase();
  const translation = preferLanguage
    ? translations.find((item) =>
      item.lakeObjectId === original.id &&
      item.tenantId === input.tenantId &&
      item.universeId === input.universeId &&
      item.targetLanguage === preferLanguage &&
      item.state === 'AVAILABLE',
    ) ?? null
    : null;
  return {
    original,
    originalText: original.originalText,
    originalLanguage: original.sourceLanguage,
    translation,
    usedTranslation: false,
  };
}

export async function multilingualStats(root = process.cwd()) {
  const translations = await load(root);
  return {
    translations: translations.length,
    available: translations.filter((item) => item.state === 'AVAILABLE').length,
    unavailable: translations.filter((item) => item.state === 'UNAVAILABLE').length,
    waitingData: translations.filter((item) => item.state === 'WAITING_DATA').length,
    originalsReplaced: 0,
    productionAuthorization: false as const,
  };
}
