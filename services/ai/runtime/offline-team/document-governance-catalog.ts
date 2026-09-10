export type DocumentClass = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET';
export interface GovernedDocument { path: string; classification: DocumentClass; ownerRole: string; evidenceRefs: readonly string[]; indexed: boolean; }
export const DOCUMENT_GOVERNANCE_GUARDRAILS = { topSecretIndexingAllowed:false, crossTenantLeakageAllowed:false, secretsInEmbeddingsAllowed:false } as const;
export function organizeDocuments(docs: readonly GovernedDocument[]) {
  return Object.freeze(docs.map((doc) => Object.freeze({ ...doc, indexed: doc.classification === 'TOP_SECRET' ? false : doc.indexed })));
}
