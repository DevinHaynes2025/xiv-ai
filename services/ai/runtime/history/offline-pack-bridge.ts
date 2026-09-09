/**
 * 62L-EX15 — soft bridge to EX14 offlinepacks when present.
 * Presence ≠ VERIFIED. Absent → WAITING_DATA (never block forever).
 * Does not copy EX14 modules; does not expand permissions.
 */

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { HistoricalComputingEvent, SoftWirePresence } from './types.ts';
import { ex15SoftWireSnapshot } from './soft-wire.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

export type OfflinePackAttachResult = {
  attached: boolean;
  disposition: SoftWirePresence['disposition'];
  note: string;
  eventId: string;
  /** Historical events enter packs as research material only. */
  becomesCurrentEngineeringTruth: false;
  becomesQuantumAdvantageVerified: false;
};

/**
 * Attach a historical event summary into an offline research pack slot
 * when EX14 offlinepacks modules are present. Never fabricates pack contents
 * when absent — returns WAITING_DATA.
 */
export function attachEventToOfflineResearchPack(
  event: HistoricalComputingEvent,
): OfflinePackAttachResult {
  const soft = ex15SoftWireSnapshot();
  const pack = soft.ex14;
  if (pack.disposition === 'WAITING_DATA') {
    return {
      attached: false,
      disposition: 'WAITING_DATA',
      note: pack.note,
      eventId: event.eventId,
      becomesCurrentEngineeringTruth: false,
      becomesQuantumAdvantageVerified: false,
    };
  }

  // Soft integration only — do not import/execute unverified sibling modules.
  const localIndex = join(HERE, '../offlinepacks/index.ts');
  const localPresent = existsSync(localIndex);

  return {
    attached: localPresent || pack.present,
    disposition: 'PRESENT_UNVERIFIED',
    note: localPresent
      ? `Historical event ${event.eventId} marked for offline pack attach (local offlinepacks PRESENT_UNVERIFIED).`
      : `EX14 offlinepacks soft-wired via sibling — event ${event.eventId} eligible; presence ≠ VERIFIED; not merged onto tip.`,
    eventId: event.eventId,
    becomesCurrentEngineeringTruth: false,
    becomesQuantumAdvantageVerified: false,
  };
}
