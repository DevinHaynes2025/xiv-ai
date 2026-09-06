import type { DataProvenance, LiveSourceStatus } from './adapters/types';
import type { BusinessHealthFinding, HealthDomain } from './findings';
import { buildCausalChain } from './story';
import type { BusinessContext, ContextSourceLabel, OrganizationContextSlice } from './types';

export type BusinessHealthReport = {
  organization: OrganizationContextSlice;
  overallStatus: 'healthy' | 'watch' | 'strained' | 'unknown';
  overallScore: number;
  topRisks: readonly string[];
  topOpportunities: readonly string[];
  findings: readonly BusinessHealthFinding[];
  narrativeSummary: string;
  sourceSummary: readonly ContextSourceLabel[];
  generatedAt: string;
  prototype: boolean;
  dataStatus?: LiveSourceStatus | 'prototype';
  provenance?: DataProvenance | null;
  usedPrototypeFallback?: false;
  unsupportedDomains?: readonly string[];
  freshnessStatus?: 'fresh' | 'aging' | 'stale' | 'unknown';
};

function finding(
  id: string,
  domain: HealthDomain,
  title: string,
  summary: string,
  whatHappened: string,
  whyItMatters: string,
  causes: readonly string[],
  impact: string,
  actions: readonly string[],
  labels: readonly ContextSourceLabel[],
): BusinessHealthFinding {
  return {
    findingId: id,
    domain,
    severity: 'watch',
    title,
    summary,
    whatHappened,
    whyItMatters,
    likelyCauses: causes,
    businessImpact: impact,
    recommendedActions: actions,
    confidence: 'low',
    evidenceQuality: 'sample',
    sourceLabels: labels,
    causalChain: buildCausalChain(),
    detectedAt: new Date().toISOString(),
    prototype: true,
  };
}

export function buildBusinessHealthReport(context: BusinessContext): BusinessHealthReport {
  const labels = context.system.sourceLabels;
  const findings: BusinessHealthFinding[] = [
    finding(
      'f_supply_variability',
      'supply_chain',
      'Supplier variability',
      context.operations.supplier,
      context.operations.supplier,
      'If variability persists, safety stock and warehouse load can rise. This is a hypothesized chain.',
      ['Sample supplier variability'],
      'May pressure inventory and fulfillment in the sample set.',
      ['Review supplier exception notes with a human. Do not reallocate suppliers automatically.'],
      labels,
    ),
    finding(
      'f_inventory_stock',
      'inventory',
      'Elevated safety stock',
      context.operations.inventory,
      context.operations.inventory,
      'Higher safety stock can congest warehouse space in the sample model.',
      ['Hypothesized response to supplier variability'],
      'Warehouse congestion risk in sample context.',
      ['Review safety-stock policy with operations. No WMS write.'],
      labels,
    ),
    finding(
      'f_warehouse',
      'warehouse',
      'Warehouse congestion',
      context.operations.warehouse,
      context.operations.warehouse,
      'Congestion can extend order cycle time. Not a live WMS reading.',
      ['Hypothesized safety-stock increase'],
      'Fulfillment delay risk in the sample chain.',
      ['Review a six-hour recovery window. No production change.'],
      labels,
    ),
    finding(
      'f_operations',
      'operations',
      'Fulfillment delay',
      context.operations.fulfillment,
      context.operations.fulfillment,
      'Delays can surface as customer complaints. Hypothesis, not a live order feed.',
      ['Warehouse congestion in the sample chain'],
      'Customer-experience pressure in sample context.',
      ['Keep Treat/Execute behind human approval.'],
      labels,
    ),
    finding(
      'f_customer',
      'customer',
      'Customer complaint signal',
      context.operations.customerExperience,
      context.operations.customerExperience,
      'Complaint volume is a sample downstream signal.',
      ['Fulfillment delay hypothesis'],
      'Trust score pressure in the sample composite.',
      ['Do not write CRM records from this finding.'],
      labels,
    ),
    finding(
      'f_people',
      'people',
      'Aggregate coverage',
      context.people.coverage,
      context.people.coverage,
      context.people.climate,
      ['Aggregate sample only'],
      'No individual employee is identified or monitored.',
      ['Keep people findings anonymous and aggregate.'],
      labels,
    ),
    finding(
      'f_finance',
      'finance',
      'Synthetic health score',
      context.businessHealth.summary,
      `Sample score ${context.businessHealth.score}.`,
      'Score is a synthetic composite, not a live ledger.',
      ['Prototype metrics'],
      context.businessHealth.summary,
      ['Do not post journal entries or move money.'],
      labels,
    ),
    finding(
      'f_security',
      'security',
      'Vendor token reminder',
      'A sample vendor-token reminder exists. No live secret is read.',
      'Security center flagged a simulated token rotation.',
      'Rotation is not executed by an agent.',
      ['Prototype security note'],
      'No tenant isolation change is proposed as executable.',
      ['Human-only secret rotation.'],
      labels,
    ),
    finding(
      'f_technology',
      'technology',
      'Systems not connected',
      'ERP, WMS, and TMS remain NOT CONNECTED.',
      'Context is prototype sample.',
      'Do not imply live enterprise connectivity.',
      ['Source labels'],
      'All findings inherit prototype_sample labels.',
      ['Keep source labels visible in every summary.'],
      labels,
    ),
  ];

  return {
    organization: context.organization,
    overallStatus: context.businessHealth.status,
    overallScore: context.businessHealth.score,
    topRisks: context.businessHealth.risks,
    topOpportunities: context.businessHealth.opportunities,
    findings,
    narrativeSummary: `${context.organization.name} is at watch (${context.businessHealth.score}) in prototype sample context. Hypothesized chain: supplier variability → safety stock → warehouse congestion → fulfillment delay → customer complaints.`,
    sourceSummary: labels,
    generatedAt: new Date().toISOString(),
    prototype: true,
    dataStatus: 'prototype',
    provenance: null,
    usedPrototypeFallback: false,
  };
}

export function findingsForDomain(report: BusinessHealthReport, domain: HealthDomain) {
  return report.findings.filter((item) => item.domain === domain);
}

export function toStructuredHealthResult(report: BusinessHealthReport) {
  const riskLevel = report.overallStatus === 'strained' ? 'high' : report.overallStatus === 'watch' ? 'medium' : 'low';
  return {
    summary: report.narrativeSummary,
    recommendation: report.topOpportunities[0] ?? 'Review findings with a human before any operational change.',
    riskLevel: riskLevel as 'low' | 'medium' | 'high',
    requiresApproval: true,
    evidence: [
      `prototype:${String(report.prototype)}`,
      `sources:${report.sourceSummary.join(',')}`,
      ...report.topRisks.map((risk) => `risk:${risk}`),
    ],
    proposedAction: {
      type: 'human_review',
      description: 'Prototype recommendation only. No production system is changed.',
    },
  };
}
