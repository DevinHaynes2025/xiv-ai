import { getXivAgent, type XivAgentId } from './agents';
import { authorizeDataScope, type DataScope } from './context/adapters/scope';
import type { DataDomainCapability, DataProvenance, LiveSourceStatus } from './context/adapters/types';
import type { BusinessDataAdapter } from './context/adapters/types';
import { adapterIsReadOnly, provenanceIsComplete } from './context/adapters/types';
import { canAgentAccessClassification } from './security/classification';
import { authorizePersistedTenantContext } from './tenant/context';
import type { Organization, OrganizationMembership, Universe, UniverseMembership } from './tenant/types';
import type { DataClassification } from './universe/types';

const AGENT_DATA_DOMAINS: Record<XivAgentId, readonly (keyof DataDomainCapability)[]> = {
  executive: ['operations', 'inventory', 'supply_chain', 'warehouse', 'customer', 'finance', 'technology'],
  supply_chain: ['supply_chain'],
  operations: ['operations'],
  finance: ['finance'],
  security: ['technology'],
  customer_experience: ['customer'],
  technology: ['technology'],
  innovation: [],
  guardian: [],
};

export type CompanyDataRequest = {
  agentId: string;
  ownerId?: string | null;
  organizationId?: string | null;
  universeId?: string | null;
  organization?: Pick<Organization, 'id'> | null;
  universe?: Pick<Universe, 'id' | 'organizationId'> | null;
  organizationMembership?: OrganizationMembership | null;
  universeMembership?: UniverseMembership | null;
  experienceRole?: string | null;
  profileCompany?: string | null;
  toolId: string;
  capability: 'connection_health' | 'metrics' | 'records';
  domain?: keyof DataDomainCapability;
  scope?: DataScope;
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
  unsupportedDomain?: boolean;
  freshnessStatus?: 'fresh' | 'aging' | 'stale' | 'unknown';
};

/**
 * Agents must not call adapters directly. All company data reads go through this gateway.
 * Technology domain is not a tenant-scope bypass. Scope is required.
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

      const classification = request.classification;
      if (agent.id === 'guardian' && classification && classification !== 'public') {
        return deny(
          classification === 'internal'
            ? 'Guardian cannot read personal session records.'
            : 'Guardian cannot read organization or Universe business data.',
        );
      }
      if (classification && !canAgentAccessClassification(agent.id, classification)) {
        return deny(`${agent.name} cannot read ${classification} company data.`);
      }
      if (request.domain && !AGENT_DATA_DOMAINS[agent.id]?.includes(request.domain)) {
        return {
          allowed: false,
          reason: `${agent.name} is not allowlisted for domain ${request.domain}.`,
          status: 'denied',
          records: [],
          provenance: null,
          message: `${agent.name} is not allowlisted for domain ${request.domain}.`,
          usedPrototypeFallback: false,
          unsupportedDomain: true,
        };
      }
      const capabilities = adapter.getCapabilities();
      if (request.domain && !capabilities.domains[request.domain]) {
        return {
          allowed: false,
          reason: `Unsupported domain ${request.domain}: unavailable.`,
          status: 'denied',
          records: [],
          provenance: null,
          message: `Unsupported domain ${request.domain}: unavailable.`,
          usedPrototypeFallback: false,
          unsupportedDomain: true,
        };
      }

      const status = await adapter.getConnectionStatus();
      const dataset =
        request.capability === 'records' ? await adapter.fetchRecords() : await adapter.fetchMetrics();
      if (!provenanceIsComplete(dataset.provenance)) {
        return deny('Provenance is required. Dataset rejected.');
      }

      const scoped = authorizeDataScope({
        agentId: agent.id,
        request: {
          agentId: agent.id,
          ownerId: request.ownerId,
          organizationId: request.organizationId,
          universeId: request.universeId,
          classification,
          scope: request.scope,
        },
        provenance: dataset.provenance,
      });
      if (!scoped.allowed) return deny(scoped.reason);

      if (dataset.provenance.scope === 'organization' || dataset.provenance.scope === 'universe') {
        const tenant = authorizePersistedTenantContext({
          actorUserId: request.ownerId,
          selectorOrganizationId: request.organizationId,
          selectorUniverseId: request.universeId,
          organization: request.organization,
          universe: request.universe,
          organizationMembership: request.organizationMembership,
          universeMembership: request.universeMembership,
          experienceRole: request.experienceRole,
          profileCompany: request.profileCompany,
          agentId: request.agentId,
          scope: dataset.provenance.scope,
        });
        if (!tenant.allowed) return deny(tenant.reason);
      }

      if (dataset.provenance.scope === 'personal') {
        const foreign = dataset.records.some((item) => {
          const owner = typeof item.ownerId === 'string' ? item.ownerId : null;
          return Boolean(owner && owner !== request.ownerId);
        });
        if (foreign) return deny('Personal record owner mismatch: DENY');
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
          freshnessStatus: dataset.provenance.freshnessStatus ?? 'unknown',
        };
      }
      return {
        allowed: true,
        reason: 'Read through Company Data Gateway.',
        status: dataset.provenance.freshnessStatus === 'stale' ? 'stale' : status,
        records: dataset.records,
        provenance: dataset.provenance,
        message:
          dataset.provenance.freshnessStatus === 'stale'
            ? 'STALE DATA. Do not treat as current.'
            : dataset.message,
        usedPrototypeFallback: false,
        freshnessStatus: dataset.provenance.freshnessStatus ?? 'unknown',
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
