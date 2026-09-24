import type {
  XviBrainTarget,
} from '../xvi-source-manifest';

export type XviBrainState =
  | 'READY'
  | 'INGESTING'
  | 'DEGRADED'
  | 'NEEDS_REVIEW'
  | 'PAUSED';

export interface XviBrainDefinition {
  id: XviBrainTarget;

  name: string;

  purpose: string;

  acceptsPublicData: boolean;
  acceptsRestrictedData: boolean;
  acceptsPersonalData: boolean;

  retrievalEnabled: boolean;
  trainingEnabled: boolean;

  productionAuthority: false;
  networkAuthority: false;
  autonomousExternalActions: false;
}

export const XVI_BRAIN_REGISTRY:
  Readonly<Record<XviBrainTarget, Readonly<XviBrainDefinition>>> =
  Object.freeze({

    MACRO: Object.freeze({
      id: 'MACRO',
      name: 'Macro Intelligence Brain',
      purpose:
        'Global economics, development, trade, inflation, employment, demographics and macroeconomic indicators.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    FINANCIAL: Object.freeze({
      id: 'FINANCIAL',
      name: 'Financial Intelligence Brain',
      purpose:
        'Public financial statistics, central banks, regulatory filings, audited company finance and market structure.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    COMPANY: Object.freeze({
      id: 'COMPANY',
      name: 'Company Intelligence Brain',
      purpose:
        'Public company filings, corporate reports, products, organizations, operations and competitive intelligence.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    HEALTH: Object.freeze({
      id: 'HEALTH',
      name: 'Health Intelligence Brain',
      purpose:
        'Public and aggregate health statistics, systems, epidemiology, outcomes and medical research metadata.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    MENTAL_HEALTH: Object.freeze({
      id: 'MENTAL_HEALTH',
      name: 'Mental Health Intelligence Brain',
      purpose:
        'Public and aggregate mental-health research, epidemiology, services and population-level indicators.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    GOVERNMENT: Object.freeze({
      id: 'GOVERNMENT',
      name: 'Government Intelligence Brain',
      purpose:
        'Official open government data, budgets, legislation, procurement, public statistics and public institutions.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    CODE: Object.freeze({
      id: 'CODE',
      name: 'Software & Code Brain',
      purpose:
        'Public open-source repositories, releases, dependency metadata, documentation and software ecosystems.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    SCIENCE: Object.freeze({
      id: 'SCIENCE',
      name: 'Science & Research Brain',
      purpose:
        'Open research, datasets, papers, experiments, technical publications and scientific metadata.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    SUPPLY_CHAIN: Object.freeze({
      id: 'SUPPLY_CHAIN',
      name: 'Supply Chain Brain',
      purpose:
        'Trade, logistics, ports, freight, transport, commodities, manufacturing and infrastructure.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    GEOSPATIAL: Object.freeze({
      id: 'GEOSPATIAL',
      name: 'Geospatial Intelligence Brain',
      purpose:
        'Public geographic, earth-observation, mapping, weather, climate and infrastructure information.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    TECHNOLOGY: Object.freeze({
      id: 'TECHNOLOGY',
      name: 'Technology & Cyber Brain',
      purpose:
        'Public standards, CVEs, technical documentation, hardware, software and defensive security intelligence.',
      acceptsPublicData: true,
      acceptsRestrictedData: false,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),

    GOVERNANCE: Object.freeze({
      id: 'GOVERNANCE',
      name: 'Governance & Provenance Brain',
      purpose:
        'Source provenance, licensing, freshness, policy, sensitivity, authorization and audit evidence.',
      acceptsPublicData: true,
      acceptsRestrictedData: true,
      acceptsPersonalData: false,
      retrievalEnabled: true,
      trainingEnabled: false,
      productionAuthority: false,
      networkAuthority: false,
      autonomousExternalActions: false,
    }),
  });

export const XVI_BRAIN_COUNT =
  Object.keys(
    XVI_BRAIN_REGISTRY,
  ).length;

if (XVI_BRAIN_COUNT !== 12) {
  throw new Error(
    'XVI_BRAIN_REGISTRY_INVALID_COUNT',
  );
}
