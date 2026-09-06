import { buildExecutiveBrief } from '../../brief';
import type { BusinessContextProvider, DataAvailability } from '../provider';
import type { BusinessContext } from '../types';
import { buildUnavailableHealthReport } from '../live-report';
import type { DataProvenance, LiveSourceStatus } from './types';

/**
 * Live-aware provider. Never copies prototype sample findings into a live/unavailable result.
 */
export function createLiveContextProvider(input: {
  status: LiveSourceStatus;
  provenance: DataProvenance | null;
  organizationName?: string;
}): BusinessContextProvider {
  const availability: DataAvailability = {
    status: input.status,
    message: input.status === 'live' ? 'LIVE DATA' : 'Live source unavailable',
    prototype: false,
  };
  const report = buildUnavailableHealthReport(input);
  const context: BusinessContext = {
    prototype: false,
    organization: report.organization,
    businessHealth: {
      status: 'unknown',
      score: 0,
      summary: availability.message,
      risks: [],
      opportunities: [],
    },
    operations: {
      inventory: availability.message,
      supplier: availability.message,
      warehouse: availability.message,
      fulfillment: availability.message,
      customerExperience: availability.message,
    },
    people: {
      identifiedEmployees: false,
      coverage: availability.message,
      climate: 'No individual employee is identified.',
    },
    system: {
      environment: 'development',
      serviceHealth: input.status === 'live' ? 'reachable' : 'unreachable',
      dataFreshness: input.status === 'live' ? 'live' : 'unavailable',
      sourceLabels: [],
      continuousMonitoring: false,
      dataStatus: input.status,
    },
  };

  return {
    getBusinessContext: () => context,
    getOperationalSignals: () => context.operations,
    getSystemContext: () => context.system,
    getBusinessHealthReport: () => report,
    getDataAvailability: () => availability,
    getExecutiveBrief: () =>
      buildExecutiveBrief({
        report,
        liveStatus: input.status,
        provenance: input.provenance,
      }),
  };
}
