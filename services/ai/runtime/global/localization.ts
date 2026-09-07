import type { TranslationRequest, TranslationStatus, TranslationSurface } from './types';

export const TRANSLATION_SURFACES: readonly TranslationSurface[] = [
  'ui',
  'business_content',
  'live_transcript',
  'agent_output',
  'business_documentation',
];

export type TranslationProvider = {
  status: TranslationStatus;
  translate(): never;
};

export function createUnavailableTranslationProvider(): TranslationProvider {
  return {
    status: 'not_configured',
    translate(): never {
      throw new Error('Translation provider is NOT CONFIGURED.');
    },
  };
}

export function translationStatusFor(surface: TranslationSurface): TranslationStatus {
  return surface === 'ui' ? 'prototype' : 'not_configured';
}

export function requestTranslation(input: Omit<TranslationRequest, 'certifiedLegalTranslation' | 'status'>): TranslationRequest {
  return {
    ...input,
    certifiedLegalTranslation: false,
    status: translationStatusFor(input.surface),
  };
}

export function machineTranslationIsCertifiedLegal() {
  return false;
}
