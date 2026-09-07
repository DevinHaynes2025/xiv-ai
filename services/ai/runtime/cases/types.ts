export type BusinessCaseStatus =
  | 'historical_verified'
  | 'company_authorized'
  | 'public_source'
  | 'hypothetical'
  | 'prototype';

export type BusinessCase = {
  caseId: string;
  title: string;
  companyName: string | null;
  anonymizedCompany: boolean;
  industry: string | null;
  countries: readonly string[];
  challenge: string;
  context: string;
  evidence: readonly string[];
  timeline: readonly string[];
  constraints: readonly string[];
  businessHealthDomains: readonly string[];
  rootCauses: readonly string[];
  decisions: readonly string[];
  options: readonly string[];
  recommendations: readonly string[];
  outcomes: readonly string[];
  lessons: readonly string[];
  sources: readonly string[];
  status: BusinessCaseStatus;
};

export type CaseSearchFacet =
  | 'industry'
  | 'country'
  | 'problem'
  | 'company_size'
  | 'business_function'
  | 'technology'
  | 'outcome';
