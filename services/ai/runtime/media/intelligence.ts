import type { MediaIntelligenceProvider, MediaIntelligenceResult } from './types';

export function createUnavailableMediaIntelligence(): MediaIntelligenceProvider {
  const unavailable = (mediaId: string): MediaIntelligenceResult => ({
    mediaId,
    source: 'unavailable',
    timestamp: new Date().toISOString(),
    universeId: '',
    organizationId: '',
    confidence: 'low',
    provider: 'not_wired',
    prototype: true,
    live: false,
    operational: false,
    summary: 'Media intelligence is not operational. No image, video, or transcription provider is wired.',
  });

  return {
    analyzeImage: async (mediaId) => unavailable(mediaId),
    analyzeVideo: async (mediaId) => unavailable(mediaId),
    transcribeVideo: async (mediaId) => unavailable(mediaId),
    extractBusinessEvidence: async (mediaId) => unavailable(mediaId),
  };
}
