export type CompanyGraphRelation =
  | 'HAS_IDENTIFIER'
  | 'FILED'
  | 'REPORTED'
  | 'OPERATES_IN'
  | 'OBSERVED_DURING';

export type CompanyGraphNodeKind = 'Company' | 'CIK' | 'Filing' | 'FinancialMetric' | 'Industry' | 'MarketCondition';

export type CompanyGraphEdge = {
  fromId: string;
  fromKind: CompanyGraphNodeKind;
  relation: CompanyGraphRelation;
  toId: string;
  toKind: CompanyGraphNodeKind;
  sourceId: string;
  sourceRecordId: string;
  provenanceRequired: true;
};

export function companyGraphRequiresProvenance() {
  return true;
}

export function companyGraphDatabaseDeployed() {
  return false;
}

export function buildCompanyGraphEdges(input: {
  cik: string;
  legalName: string;
  filings: readonly { sourceRecordId: string; form: string }[];
  facts: readonly { sourceRecordId: string; metric: string; period: string }[];
  industry?: string | null;
  macroPeriod?: string | null;
}): CompanyGraphEdge[] | { allowed: false; reason: string } {
  if (!input.cik) return { allowed: false, reason: 'Graph edges require CIK provenance.' };
  const companyId = `company:${input.cik}`;
  const edges: CompanyGraphEdge[] = [
    {
      fromId: companyId,
      fromKind: 'Company',
      relation: 'HAS_IDENTIFIER',
      toId: `cik:${input.cik}`,
      toKind: 'CIK',
      sourceId: 'us_sec_edgar',
      sourceRecordId: `identity:${input.cik}`,
      provenanceRequired: true,
    },
  ];
  for (const filing of input.filings) {
    if (!filing.sourceRecordId) continue;
    edges.push({
      fromId: companyId,
      fromKind: 'Company',
      relation: 'FILED',
      toId: filing.sourceRecordId,
      toKind: 'Filing',
      sourceId: 'us_sec_edgar',
      sourceRecordId: filing.sourceRecordId,
      provenanceRequired: true,
    });
  }
  for (const fact of input.facts) {
    if (!fact.sourceRecordId) continue;
    edges.push({
      fromId: companyId,
      fromKind: 'Company',
      relation: 'REPORTED',
      toId: fact.sourceRecordId,
      toKind: 'FinancialMetric',
      sourceId: 'us_sec_edgar',
      sourceRecordId: fact.sourceRecordId,
      provenanceRequired: true,
    });
  }
  if (input.industry) {
    edges.push({
      fromId: companyId,
      fromKind: 'Company',
      relation: 'OPERATES_IN',
      toId: `industry:${input.industry}`,
      toKind: 'Industry',
      sourceId: 'us_sec_edgar',
      sourceRecordId: `identity:${input.cik}`,
      provenanceRequired: true,
    });
  }
  if (input.macroPeriod) {
    edges.push({
      fromId: companyId,
      fromKind: 'Company',
      relation: 'OBSERVED_DURING',
      toId: `macro:${input.macroPeriod}`,
      toKind: 'MarketCondition',
      sourceId: 'world_bank_open_data',
      sourceRecordId: `macro-period:${input.macroPeriod}`,
      provenanceRequired: true,
    });
  }
  if (edges.some((edge) => !edge.sourceRecordId || !edge.sourceId)) {
    return { allowed: false, reason: 'Every graph edge requires provenance.' };
  }
  return edges;
}
