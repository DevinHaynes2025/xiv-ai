import { createId } from '../actions';
import type { BusinessCase, BusinessCaseStatus } from './types';

export function createBusinessCase(
  input: Omit<BusinessCase, 'caseId'> & { caseId?: string },
): BusinessCase | { allowed: false; reason: string } {
  if (input.status === 'historical_verified' && input.evidence.length === 0) {
    return { allowed: false, reason: 'Verified business case requires evidence: DENY' };
  }
  return {
    ...input,
    caseId: input.caseId ?? createId('case'),
  };
}

export function caseRemainsHypothetical(status: BusinessCaseStatus) {
  return status === 'hypothetical';
}

export function presentCaseAsReal(status: BusinessCaseStatus) {
  return status === 'historical_verified' || status === 'company_authorized' || status === 'public_source';
}

export function runBusinessCaseEngine(input: {
  signal: string;
  evidence: readonly string[];
  context: string;
  status: BusinessCaseStatus;
}) {
  const created = createBusinessCase({
    title: input.signal,
    companyName: input.status === 'hypothetical' ? 'Anonymized example company' : null,
    anonymizedCompany: true,
    industry: null,
    countries: [],
    challenge: input.signal,
    context: input.context,
    evidence: input.evidence,
    timeline: [],
    constraints: [],
    businessHealthDomains: [],
    rootCauses: [],
    decisions: [],
    options: [],
    recommendations: [],
    outcomes: [],
    lessons: [],
    sources: input.evidence,
    status: input.status,
  });
  return created;
}

export const PROTOTYPE_BUSINESS_CASES: readonly BusinessCase[] = [
  {
    caseId: 'case_proto_ops_delay',
    title: 'Prototype: delayed outbound fulfillment',
    companyName: 'Northstar Logistics (DEMO)',
    anonymizedCompany: false,
    industry: 'logistics',
    countries: ['US'],
    challenge: 'Outbound orders slipped after a dock-door constraint.',
    context: 'Labeled prototype from the existing Northstar diagnostic story. Not a live customer incident.',
    evidence: ['prototype_northstar_story'],
    timeline: ['Constraint observed in DEMO context'],
    constraints: ['No live WMS connected'],
    businessHealthDomains: ['operations', 'supply_chain'],
    rootCauses: ['Prototype causal chain only'],
    decisions: ['Hold a recommended staffing change for human approval'],
    options: ['Defer non-critical outbound', 'Request human review of dock allocation'],
    recommendations: ['Treat as a diagnostic story, not a production incident'],
    outcomes: [],
    lessons: ['Prototype cases stay labeled prototype until evidence is authorized.'],
    sources: ['XIV prototype diagnostic story'],
    status: 'prototype',
  },
  {
    caseId: 'case_hypo_market_entry',
    title: 'Hypothetical: evaluating a second-country warehouse',
    companyName: null,
    anonymizedCompany: true,
    industry: 'logistics',
    countries: [],
    challenge: 'A company is considering a second-country warehouse.',
    context: 'Explicitly hypothetical teaching case. No real company, market size, or legal conclusion is attached.',
    evidence: [],
    timeline: [],
    constraints: ['No legal or tax certainty'],
    businessHealthDomains: ['strategy'],
    rootCauses: [],
    decisions: [],
    options: ['Stay domestic', 'Partner locally', 'Build later'],
    recommendations: ['Treat every option as a scenario until verified local sources exist'],
    outcomes: [],
    lessons: ['Hypothetical cases must never be presented as real.'],
    sources: [],
    status: 'hypothetical',
  },
];

export function createCaseFromPublicEvent(input: {
  eventId: string;
  title: string;
  country: string;
  evidence: readonly string[];
  context: string;
}): ReturnType<typeof createBusinessCase> {
  if (!input.eventId || input.evidence.length === 0) {
    return { allowed: false, reason: 'Public-source case requires a sourced event and evidence: DENY' };
  }
  return createBusinessCase({
    title: input.title,
    companyName: null,
    anonymizedCompany: true,
    industry: null,
    countries: [input.country],
    challenge: input.title,
    context: input.context,
    evidence: input.evidence,
    timeline: [],
    constraints: ['No invented financial impact', 'No invented outcome'],
    businessHealthDomains: [],
    rootCauses: [],
    decisions: [],
    options: [],
    recommendations: [],
    outcomes: [],
    lessons: [],
    sources: input.evidence,
    status: 'public_source',
  });
}

export function caseHasUnsupportedFinancialImpact(item: BusinessCase) {
  return item.outcomes.some((row) => /\$|usd|revenue|profit/i.test(row));
}

export function searchCases(
  cases: readonly BusinessCase[],
  facet: { industry?: string; country?: string; status?: BusinessCaseStatus },
) {
  return cases.filter((item) => {
    if (facet.industry && item.industry !== facet.industry) return false;
    if (facet.country && !item.countries.includes(facet.country)) return false;
    if (facet.status && item.status !== facet.status) return false;
    return true;
  });
}
