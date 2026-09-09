import { SEALED_REDACTION } from './ceo-sealed-vault';
import type { TransferEnvelope } from './resumable-package-transfer';
import { envelopeMac } from './content-addressed-store';

export function requireEncryptedTransport(envelope: Pick<TransferEnvelope, 'id' | 'transferId' | 'mac' | 'bodyPreview' | 'sealedRedacted' | 'classification'>) {
  if (envelope.classification === ('sealed_founder_priority' as string)) {
    return { ok: false as const, reason: 'Sealed founder-priority classification cannot use the transfer transport.' };
  }
  if (!envelope.sealedRedacted) {
    return { ok: false as const, reason: 'Transport requires sealed fields to be redacted before the envelope leaves the vault.' };
  }
  if (envelope.bodyPreview.includes(SEALED_REDACTION) === false && /SEALED_FOUNDER_PRIORITY|sealedPayload/.test(envelope.bodyPreview)) {
    return { ok: false as const, reason: 'Envelope body preview still carries sealed payload markers.' };
  }
  const expected = envelopeMac(envelope.transferId, envelope.bodyPreview);
  if (envelope.mac !== expected) {
    return { ok: false as const, reason: 'Encrypted-transport requirement failed: HMAC mismatch. Plaintext sealed routing is denied.' };
  }
  return {
    ok: true as const,
    reason: 'HMAC envelope accepted. Local sandbox MAC is not a production TLS/AWS certification.',
    productionCryptoCertification: false as const,
  };
}
