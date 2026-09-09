export type CompanyIdentifierKind = 'sec_cik' | 'legal_name' | 'ticker';

export type CompanyIdentifier = {
  kind: CompanyIdentifierKind;
  value: string;
  authoritative: boolean;
};

export type SecCompanyIdentity = {
  cik: string;
  legalName: string;
  ticker: string | null;
  sourceId: 'us_sec_edgar';
};

export type CompanyIdentityEvidence = {
  evidenceId: string;
  kind: 'sec_cik' | 'legal_name' | 'ticker';
  sourceId: string;
  summary: string;
};

export type CompanyIdentity = {
  identityId: string;
  identifiers: readonly CompanyIdentifier[];
  sec: SecCompanyIdentity | null;
  evidence: readonly CompanyIdentityEvidence[];
};

export function companyIdentityFromSec(input: {
  cik: string;
  legalName: string;
  ticker?: string | null;
}): CompanyIdentity | { allowed: false; reason: string } {
  const cik = input.cik.replace(/\D/g, '').padStart(10, '0');
  const legalName = input.legalName.trim();
  if (!cik || cik === '0000000000' || !legalName) {
    return { allowed: false, reason: 'Company identity requires an authoritative CIK and legal name.' };
  }
  const ticker = input.ticker?.trim() || null;
  const identifiers: CompanyIdentifier[] = [
    { kind: 'sec_cik', value: cik, authoritative: true },
    { kind: 'legal_name', value: legalName, authoritative: false },
  ];
  if (ticker) identifiers.push({ kind: 'ticker', value: ticker, authoritative: false });
  return {
    identityId: `sec:${cik}`,
    identifiers,
    sec: { cik, legalName, ticker, sourceId: 'us_sec_edgar' },
    evidence: [
      {
        evidenceId: `cik:${cik}`,
        kind: 'sec_cik',
        sourceId: 'us_sec_edgar',
        summary: `SEC CIK ${cik} is authoritative identity evidence.`,
      },
    ],
  };
}

export function cikIsAuthoritativeIdentity() {
  return true;
}

export function mergeCompaniesByNameOnly(leftName: string, rightName: string) {
  return {
    merged: false as const,
    similar: leftName.trim().toLowerCase() === rightName.trim().toLowerCase(),
    reason: 'Company identity does not merge solely because names look similar. CIK evidence is required.',
  };
}
