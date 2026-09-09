export type LegalAssistanceClass = 'LEGAL_INFORMATION' | 'LEGAL_WORKFLOW' | 'ATTORNEY_ADVICE';

export type LegalPracticeArea =
  | 'Corporate'
  | 'Contracts'
  | 'Employment'
  | 'Intellectual Property'
  | 'Privacy'
  | 'Cybersecurity'
  | 'Technology'
  | 'AI Governance'
  | 'International Trade'
  | 'Customs'
  | 'Supply Chain'
  | 'Real Estate'
  | 'Insurance'
  | 'Securities'
  | 'M&A'
  | 'Venture Capital'
  | 'Tax'
  | 'Compliance'
  | 'Procurement'
  | 'Licensing'
  | 'Data Protection'
  | 'Product Liability'
  | 'Environmental'
  | 'Cross-border Commerce';

export type JourneyImageClass =
  | 'VERIFIED_SOURCE_IMAGE'
  | 'SUPPLIER_PROVIDED'
  | 'PUBLIC_SOURCE'
  | 'USER_UPLOADED'
  | 'ILLUSTRATIVE_AI_IMAGE';

export type DataPlacement = 'RETAINED_AT_SOURCE' | 'INDEXED_METADATA' | 'EMBEDDING' | 'NORMALIZED_EVENT' | 'COMPANY_BRAIN';

export type IndustryPackId =
  | 'WAREHOUSE'
  | 'INSURANCE'
  | 'REAL_ESTATE'
  | 'MANUFACTURING'
  | 'RETAIL'
  | 'HEALTHCARE_OPERATIONS'
  | 'RESTAURANT'
  | 'CONSTRUCTION'
  | 'FINANCE_OPERATIONS'
  | 'LEGAL_OPERATIONS';

export type HostPlatform = 'IOS' | 'ANDROID' | 'WINDOWS' | 'MACOS' | 'WEB' | 'DESKTOP' | 'TV';
