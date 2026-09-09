import { providerStatusOf } from './registry';
import { secGlobalFabricIsProductionLive } from './sec-status';
import { worldBankGlobalFabricIsProductionLive } from './world-bank-status';

/**
 * Canonical catalog truth after seedDeclaredBusinessDataProviders().
 * World Bank + SEC are authorized public adapters.
 * Unproven U.S. government feeds remain not_configured.
 * Neither adapter implies Global Data Fabric production-live.
 */
export const UNPROVEN_PUBLIC_PROVIDER_IDS = ['us_bls', 'us_fred', 'us_census'] as const;

export function catalogSecuritySnapshot() {
  return {
    worldBank: providerStatusOf('world_bank_open_data'),
    secEdgar: providerStatusOf('us_sec_edgar'),
    unproven: {
      us_bls: providerStatusOf('us_bls'),
      us_fred: providerStatusOf('us_fred'),
      us_census: providerStatusOf('us_census'),
    },
    worldBankFabricProductionLive: worldBankGlobalFabricIsProductionLive(),
    secFabricProductionLive: secGlobalFabricIsProductionLive(),
  };
}

export function catalogSecurityIsSound() {
  const snap = catalogSecuritySnapshot();
  return (
    snap.worldBank === 'authorized' &&
    snap.secEdgar === 'authorized' &&
    snap.unproven.us_bls === 'not_configured' &&
    snap.unproven.us_fred === 'not_configured' &&
    snap.unproven.us_census === 'not_configured' &&
    snap.worldBankFabricProductionLive === false &&
    snap.secFabricProductionLive === false
  );
}

export function secActivationDoesNotInvalidateWorldBankCatalog() {
  return (
    providerStatusOf('world_bank_open_data') === 'authorized' &&
    providerStatusOf('us_sec_edgar') === 'authorized' &&
    worldBankGlobalFabricIsProductionLive() === false
  );
}
