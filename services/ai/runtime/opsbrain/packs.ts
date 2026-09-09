import { installGovernedIndustryPack } from '../platform/plugins';
import type { IndustryPackId } from '../ecosystem/types';
import type { SoftwarePackKind } from './types';
import { SOFTWARE_PACKS } from './types';

const PACK_TO_INDUSTRY: Partial<Record<SoftwarePackKind, IndustryPackId>> = {
  WarehousePack: 'WAREHOUSE',
  InsurancePack: 'INSURANCE',
  RealEstatePack: 'REAL_ESTATE',
  RetailPack: 'RETAIL',
  ManufacturingPack: 'MANUFACTURING',
  LegalOperationsPack: 'LEGAL_OPERATIONS',
};

export function installSoftwarePack(input: {
  kind: SoftwarePackKind;
  signed: boolean;
  scanned: boolean;
  requestedPermissions: readonly string[];
  companyApproved: boolean;
  universeBound: boolean;
}) {
  void SOFTWARE_PACKS;
  const packId = PACK_TO_INDUSTRY[input.kind];
  if (!packId) {
    return { allowed: false as const, reason: 'software_pack_requires_governed_industry_binding', automaticDataAccess: false as const };
  }
  const installed = installGovernedIndustryPack({
    packId,
    signed: input.signed,
    scanned: input.scanned,
    requestedPermissions: input.requestedPermissions,
    companyApproved: input.companyApproved,
    universeBound: input.universeBound,
  });
  if ('allowed' in installed) return { ...installed, automaticDataAccess: false as const };
  return { ...installed, automaticDataAccess: false as const };
}

export function softwarePackShippedInsideMobileBinary(_kind: SoftwarePackKind): false {
  return false;
}
