import { getXivAgent } from './agents';
import type { DataProvenance, LiveSourceStatus } from './context/adapters/types';
import type { BusinessDataAdapter } from './context/adapters/types';
import { adapterIsReadOnly, provenanceIsComplete } from './context/adapters/types';
import { canAgentAccessClassification } from './security/classification';
import type { DataClassification } from './universe/types';

export type CompanyDataRequest = {
  agentId: string;
  organizationId?: string | null;
  universeId?: string | null;
  toolId: string;
  capability: 'connection_health' | 'metrics' | 'records';
  mode: 'read' | 'write';
  classification?: DataClassification;
};

export type CompanyDataResult = {
  allowed: boolean;
  reason: string;
  status: LiveSourceStatus | 'denied';
  records: readonly Record<string, unknown>[];
  provenance: DataProvenance | null;
  message: string;
  usedPrototypeFallback: false;
};

/**
 * Agents must not call adapters directly. All company data reads go through this gateway.
 * Phase 2D is read-only. No mutation methods exist.
 */
export function createCompanyDataGateway(adapter: BusinessDataAdapter) {
  if (!adapterIsReadOnly(adapter)) {
    throw new Error('Company Data Gateway accepts read-only adapters only.');
  }

  return {
    async read(request: CompanyDataRequest): Promise<CompanyDataResult> {
      if (request.mode === 'write') {
        return deny('Company Data Gateway is read-only. No write adapters.');
      }
      const agent = getXivAgent(request.agentId);
      if (!agent) return deny('Unknown agent: DENY');
      if (agent.status === 'future') return deny('Future agent cannot read company data.');
      if (!request.organizationId && request.classification && request.classification !== 'public') {
        return deny('Missing organization: DENY');
      }
      const classification = request.classification ?? 'internal';
      if (!canAgentAccessClassification(agent.id, classification)) {
        return deny(`${agent.name} cannot read ${classification} company data.`);
      }
      if (agent.id === 'guardian' && classification !== 'public') {
        return deny('Guardian cannot read private business data.');
      }

      const status = await adapter.getConnectionStatus();
      const dataset =
        request.capability === 'records' ? await adapter.fetchRecords() : await adapter.fetchMetrics();
      if (!provenanceIsComplete(dataset.provenance)) {
        return deny('Provenance is required. Dataset rejected.');
      }
      if (status !== 'live') {
        return {
          allowed: true,
          reason: 'Live source is not returning business records.',
          status,
          records: [],
          provenance: dataset.provenance,
          message: 'Live source unavailable',
          usedPrototypeFallback: false,
        };
      }
      return {
        allowed: true,
        reason: 'Read through Company Data Gateway.',
        status,
        records: dataset.records,
        provenance: dataset.provenance,
        message: dataset.message,
        usedPrototypeFallback: false,
      };
    },
  };
}

function deny(reason: string): CompanyDataResult {
  return {
    allowed: false,
    reason,
    status: 'denied',
    records: [],
    provenance: null,
    message: reason,
    usedPrototypeFallback: false,
  };
}

export type CompanyDataGateway = ReturnType<typeof createCompanyDataGateway>;
