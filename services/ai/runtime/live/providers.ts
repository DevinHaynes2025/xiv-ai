import type { ModerationRecommendation, ProviderStatus } from './types';

export type LiveStreamProvider = {
  status: ProviderStatus;
  name: 'none';
  start(): never;
};

export type LiveRecordingProvider = {
  status: ProviderStatus;
  record(): never;
};

export type LiveTranscriptProvider = {
  status: ProviderStatus;
  transcribe(): never;
};

export type LiveSummaryProvider = {
  status: ProviderStatus;
  summarize(): never;
};

export type LiveDlpProvider = {
  status: ProviderStatus;
  scan(): never;
};

export function createUnavailableLiveStreamProvider(): LiveStreamProvider {
  return {
    status: 'not_configured',
    name: 'none',
    start(): never {
      throw new Error('Live streaming provider is NOT CONFIGURED.');
    },
  };
}

export function createUnavailableRecordingProvider(): LiveRecordingProvider {
  return {
    status: 'not_configured',
    record(): never {
      throw new Error('Live recording provider is NOT CONFIGURED.');
    },
  };
}

export function createUnavailableTranscriptProvider(): LiveTranscriptProvider {
  return {
    status: 'not_configured',
    transcribe(): never {
      throw new Error('Live transcript provider is NOT CONFIGURED.');
    },
  };
}

export function createUnavailableLiveSummaryProvider(): LiveSummaryProvider {
  return {
    status: 'not_configured',
    summarize(): never {
      throw new Error('Live summary provider is NOT CONFIGURED.');
    },
  };
}

export function createUnavailableDlpProvider(): LiveDlpProvider {
  return {
    status: 'not_configured',
    scan(): never {
      throw new Error('Live DLP provider is NOT CONFIGURED. Detection is not simulated.');
    },
  };
}

export function recommendModeration(kind: ModerationRecommendation) {
  return {
    recommendation: kind,
    autoBan: false,
    autoTerminate: false,
    reason: 'Moderation may recommend only. Human and policy remain authoritative.',
  };
}
