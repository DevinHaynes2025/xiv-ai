import type { AuthorizedSessionRecord } from './adapters/session-records';
import type { DataProvenance, DataDomainCapability, LiveSourceStatus } from './adapters/types';
import type { BusinessHealthFinding } from './findings';
import type { BusinessHealthReport } from './report';

export function buildLiveHealthFromRecords(input: {
  records: readonly Record<string, unknown>[];
  provenance: DataProvenance | null;
  status: LiveSourceStatus;
  domains: DataDomainCapability;
  organizationName?: string;
}): BusinessHealthReport {
  if (!input.provenance || input.status === 'unavailable' || input.status === 'not_configured') {
    return {
      organization: {
        id: input.provenance?.organizationId ?? 'unknown',
        name: input.organizationName ?? 'Unknown organization',
        industry: 'unknown',
        region: 'unknown',
      },
      overallStatus: 'unknown',
      overallScore: 0,
      topRisks: [],
      topOpportunities: [],
      findings: [],
      narrativeSummary: input.status === 'stale' ? 'STALE DATA' : 'Live source unavailable',
      sourceSummary: [],
      generatedAt: new Date().toISOString(),
      prototype: false,
      dataStatus: input.status,
      provenance: input.provenance,
      usedPrototypeFallback: false,
      unsupportedDomains: Object.entries(input.domains)
        .filter(([, enabled]) => !enabled)
        .map(([domain]) => domain),
      freshnessStatus: input.provenance?.freshnessStatus ?? 'unknown',
    };
  }

  const typed = input.records as AuthorizedSessionRecord[];
  const activity = typed.find((item) => item.kind === 'agent_activity');
  const identity = typed.find((item) => item.kind === 'profile_identity');
  const findings: BusinessHealthFinding[] = [];

  if (activity && typeof activity.actionCount === 'number') {
    findings.push({
      findingId: 'live_agent_activity',
      domain: 'technology',
      severity: 'info',
      title: 'Governed agent activity',
      summary: `${activity.actionCount} owner-scoped governed action(s) were read.`,
      whatHappened: `${activity.actionCount} governed agent action rows were retrieved for the signed-in user.`,
      whyItMatters: 'This is authorized account activity, not ERP, WMS, or TMS throughput.',
      likelyCauses: ['Observed from ai_agent_actions under owner RLS.'],
      businessImpact: 'Financial impact unavailable from connected sources.',
      recommendedActions: ['Treat this as technology/governance context only.'],
      confidence: 'medium',
      evidenceQuality: 'live',
      sourceLabels: [],
      causalChain: [
        {
          step: 1,
          label: `${activity.actionCount} governed actions observed`,
          stance: 'observed',
          prototype: false,
        },
        {
          step: 2,
          label: 'No operational cause is implied',
          stance: 'hypothesized',
          prototype: false,
        },
        {
          step: 3,
          label: 'Keep production writes human-approved',
          stance: 'recommended',
          prototype: false,
        },
      ],
      detectedAt: new Date().toISOString(),
      prototype: false,
      provenance: input.provenance,
    });
  }

  const company = identity?.company?.trim();
  const narrative = company
    ? `LIVE DATA. User-declared identity context (${company}). Not an organization-authoritative business record. ${findings.length} observed technology finding(s). Operational domains are not connected.`
    : `LIVE DATA. ${findings.length} observed owner-scoped finding(s). Operational domains are not connected.`;

  return {
    organization: {
      id: input.provenance.organizationId ?? identity?.organizationId ?? 'unknown',
      name: input.organizationName ?? company ?? 'Authorized account',
      industry: identity?.industry ?? 'unknown',
      region: 'unknown',
    },
    overallStatus: findings.length ? 'watch' : 'unknown',
    overallScore: 0,
    topRisks: input.provenance.freshnessStatus === 'stale' ? ['Connected source is stale. Do not treat as current.'] : [],
    topOpportunities: [],
    findings,
    narrativeSummary: input.provenance.freshnessStatus === 'stale' ? 'STALE DATA. Do not treat as current.' : narrative,
    sourceSummary: [],
    generatedAt: new Date().toISOString(),
    prototype: false,
    dataStatus: input.provenance.freshnessStatus === 'stale' ? 'stale' : input.status,
    provenance: input.provenance,
    usedPrototypeFallback: false,
    unsupportedDomains: Object.entries(input.domains)
      .filter(([, enabled]) => !enabled)
      .map(([domain]) => domain),
    freshnessStatus: input.provenance.freshnessStatus ?? 'unknown',
  };
}
