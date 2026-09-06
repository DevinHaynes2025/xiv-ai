import type { BusinessContextProvider } from './provider';
import type { BusinessContext } from './types';

const PROTOTYPE_CONTEXT: BusinessContext = {
  prototype: true,
  organization: {
    id: 'org_northstar_placeholder',
    name: 'Northstar Logistics',
    industry: 'Logistics',
    region: 'Nordic corridor',
  },
  businessHealth: {
    status: 'watch',
    score: 86,
    summary: 'Synthetic composite of revenue integrity, operations load, customer trust, and workforce risk.',
    risks: [
      'Two warehouses are off SLA in the sample set.',
      'Supplier variability is raising safety-stock pressure.',
    ],
    opportunities: [
      'Overnight Nordic bookings recovered after a weather hold.',
      'A six-hour recovery window is the cleanest governed next step to review.',
    ],
  },
  operations: {
    inventory: 'Safety stock is elevated on two sample SKU families. No live inventory system is connected.',
    supplier: 'Sample supplier variability is the first link in the diagnostic chain. No TMS/ERP is connected.',
    warehouse: 'Harbor and Plant 3 show congestion in the sample. Status: NOT CONNECTED.',
    fulfillment: 'Fulfillment delay appears after warehouse congestion in the sample chain.',
    customerExperience: 'Customer-complaint volume is a sample downstream signal. No live CRM write exists.',
  },
  people: {
    identifiedEmployees: false,
    coverage: 'Night-shift coverage is thin on Plant 2 in the aggregate sample. No individual is identified.',
    climate: 'Anonymous floor climate is summarized only. Individual employee monitoring is not permitted.',
  },
  system: {
    environment: 'prototype',
    serviceHealth: 'unknown',
    dataFreshness: 'sample',
    sourceLabels: [
      'prototype_sample',
      'not_connected_erp',
      'not_connected_wms',
      'not_connected_tms',
      'aggregate_people_signal',
    ],
    continuousMonitoring: false,
  },
};

export function getPrototypeBusinessContext(): BusinessContext {
  return PROTOTYPE_CONTEXT;
}

export function createPrototypeContextProvider(): BusinessContextProvider {
  return {
    getBusinessContext: () => PROTOTYPE_CONTEXT,
    getOperationalSignals: () => PROTOTYPE_CONTEXT.operations,
    getSystemContext: () => PROTOTYPE_CONTEXT.system,
  };
}
