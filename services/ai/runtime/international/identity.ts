import type { InternationalCompanyIdentity } from './types';

export function jurisdictionCompanyKey(identity: Pick<InternationalCompanyIdentity, 'country' | 'lei' | 'registry' | 'registryId'>) {
  if (identity.lei) return `lei:${identity.lei}`;
  if (identity.registry && identity.registryId) return `${identity.country}:${identity.registry}:${identity.registryId}`;
  return null;
}

export function sameInternationalCompany(
  a: Pick<InternationalCompanyIdentity, 'country' | 'lei' | 'registry' | 'registryId' | 'legalName'>,
  b: Pick<InternationalCompanyIdentity, 'country' | 'lei' | 'registry' | 'registryId' | 'legalName'>,
) {
  const left = jurisdictionCompanyKey(a);
  const right = jurisdictionCompanyKey(b);
  if (!left || !right) return false;
  return left === right;
}

export function nameOnlyCompanyMergeDenied(
  a: Pick<InternationalCompanyIdentity, 'country' | 'lei' | 'registry' | 'registryId' | 'legalName'>,
  b: Pick<InternationalCompanyIdentity, 'country' | 'lei' | 'registry' | 'registryId' | 'legalName'>,
) {
  if (a.legalName.toLowerCase() === b.legalName.toLowerCase() && !sameInternationalCompany(a, b)) {
    return { allowed: false as const, reason: 'Companies are not merged across jurisdictions from legal name alone.' };
  }
  return { allowed: sameInternationalCompany(a, b), reason: sameInternationalCompany(a, b) ? 'Identifier match.' : 'Insufficient identifiers.' };
}
