import type { DataClassification } from '../../universe/types';
import { classifyFreshness } from './freshness';
import { scopeFromRelationship, type DataScope } from './scope';
import type {
  AdapterDataset,
  BusinessDataAdapter,
  DataDomainCapability,
  DataProvenance,
  LiveSourceStatus,
} from './types';

export type AuthorizedSessionRecord = {
  kind: 'profile_identity' | 'agent_activity';
  ownerId: string | null;
  scope: DataScope;
  sourceRecordId: string | null;
  organizationId: string | null;
  universeId: string | null;
  company?: string | null;
  industry?: string | null;
  professionalTitle?: string | null;
  actionCount?: number;
  lastActionAt?: string | null;
  sourceUpdatedAt?: string | null;
};

export type SessionRecordReader = () => Promise<AuthorizedSessionRecord[]> | AuthorizedSessionRecord[];

const NO_DOMAINS: DataDomainCapability = {
  operations: false,
  inventory: false,
  supply_chain: false,
  warehouse: false,
  customer: false,
  finance: false,
  technology: false,
};

function nonempty(value?: string | null) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function recordScope(record: AuthorizedSessionRecord | undefined): DataScope {
  if (record?.scope) return record.scope;
  return scopeFromRelationship({
    organizationId: record?.organizationId,
    universeId: record?.universeId,
  });
}

function provenanceFor(
  records: readonly AuthorizedSessionRecord[],
  status: LiveSourceStatus,
  ownerId: string | null,
): DataProvenance {
  const first = records[0];
  const retrievedAt = new Date().toISOString();
  const sourceUpdatedAt = first?.sourceUpdatedAt ?? first?.lastActionAt ?? retrievedAt;
  const freshnessStatus = classifyFreshness({ retrievedAt, sourceUpdatedAt });
  const organizationId = nonempty(first?.organizationId);
  const universeId = nonempty(first?.universeId);
  const scope = recordScope(first);
  const resolvedOwner = nonempty(first?.ownerId) ?? ownerId;
  return {
    sourceId: 'xiv-session-authorized',
    sourceSystem: 'supabase_owner_rls',
    sourceType: first?.kind ?? 'authorized_session',
    sourceRecordId: first?.sourceRecordId ?? null,
    organizationId,
    universeId,
    ownerId: resolvedOwner,
    scope,
    retrievedAt,
    sourceUpdatedAt,
    freshness: freshnessStatus,
    freshnessStatus,
    live: status === 'live',
    prototype: false,
    confidence: 'medium',
    dataClassification: 'internal' satisfies DataClassification,
  };
}

/**
 * Real read-only adapter for owner-scoped session records already available
 * (profile identity + governed agent activity). Does not invent ERP/WMS/TMS rows.
 * Profile company/title fields are user-declared identity, not organization records.
 */
export function createSessionRecordAdapter(input: {
  reader?: SessionRecordReader;
  ownerId?: string | null;
  organizationId?: string | null;
  universeId?: string | null;
} = {}): BusinessDataAdapter {
  const ownerId = nonempty(input.ownerId);

  async function load(): Promise<AdapterDataset<Record<string, unknown>>> {
    if (!input.reader) {
      return {
        status: 'not_configured',
        records: [],
        provenance: provenanceFor([], 'not_configured', ownerId),
        message: 'Authorized session record reader is not configured.',
      };
    }
    try {
      const records = await input.reader();
      const status: LiveSourceStatus = 'live';
      return {
        status,
        records: records.map((item) => ({
          ...item,
          ownerId: nonempty(item.ownerId) ?? ownerId,
          scope: item.scope ?? recordScope(item),
          companyDeclared: Boolean(item.company),
          organizationAuthoritative: false,
        })),
        provenance: provenanceFor(records, status, ownerId),
        message:
          records.length === 0
            ? 'Authorized session read succeeded. No identity or agent-activity records were returned.'
            : `Authorized session returned ${records.length} owner-scoped record(s). Profile company/title are user-declared identity, not organization-authoritative business records. ERP, WMS, and TMS remain unavailable.`,
      };
    } catch {
      return {
        status: 'unavailable',
        records: [],
        provenance: provenanceFor([], 'unavailable', ownerId),
        message: 'Live source unavailable',
      };
    }
  }

  return {
    getCapabilities() {
      return {
        read: true,
        write: false,
        metrics: true,
        records: Boolean(input.reader),
        connectionHealth: false,
        domains: { ...NO_DOMAINS, technology: Boolean(input.reader) },
      };
    },
    getSourceMetadata() {
      return {
        sourceId: 'xiv-session-authorized',
        sourceSystem: 'supabase_owner_rls',
        sourceType: 'authorized_session',
        configured: Boolean(input.reader),
        writeSupported: false as const,
      };
    },
    async getConnectionStatus() {
      if (!input.reader) return 'not_configured';
      const dataset = await load();
      return dataset.status;
    },
    async getFreshness() {
      const dataset = await load();
      return dataset.provenance.freshness;
    },
    fetchMetrics: load,
    fetchRecords: load,
  };
}

export function emptyDomainCapabilities(): DataDomainCapability {
  return { ...NO_DOMAINS };
}
