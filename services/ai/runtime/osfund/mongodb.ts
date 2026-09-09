/**
 * MongoDB adapter contracts. Remain NOT_CONFIGURED unless proven.
 */

import type { ConnectorLifecycle } from './types';

export type MongoAdapterContract = {
  kind: 'MONGODB';
  state: ConnectorLifecycle;
  productionLive: false;
  returnsRawCredentials: false;
  documentBypassesClassification: false;
};

export function openMongoAdapter(): MongoAdapterContract {
  return {
    kind: 'MONGODB',
    state: 'NOT_CONFIGURED',
    productionLive: false,
    returnsRawCredentials: false,
    documentBypassesClassification: false,
  };
}

export function mongoAdapterState(): ConnectorLifecycle {
  return 'NOT_CONFIGURED';
}

export function mongoMarkedLiveWithoutProof(): false {
  return false;
}

export function mongoDocumentBypassesClassification(): false {
  return false;
}
