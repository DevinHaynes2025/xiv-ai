export type SensitiveSignal = 'LOCATION'|'MOBILITY'|'VIEWING'|'EMOTION'|'MARKET_INTEREST'|'DEVICE_USAGE';
export type ConsentState = 'GRANTED'|'REVOKED'|'EXPIRED'|'UNVERIFIED';

export interface SignalConsent {
  userId: string;
  signal: SensitiveSignal;
  state: ConsentState;
  scope: string[];
  expiresAt?: string;
  receiptId: string;
}

export interface MobilityMediaEvent {
  tenantId: string;
  userId: string;
  signal: SensitiveSignal;
  source: 'DEVICE'|'TV'|'TRANSIT'|'VEHICLE'|'STREAMING'|'MAPS'|'MANUAL';
  capturedAt: string;
  classification: 'PRIVATE'|'CONFIDENTIAL'|'TOP_SECRET';
  consentReceiptId: string;
  rawPayloadStoredLocally: boolean;
}

export function mayCapture(event: MobilityMediaEvent, consent: SignalConsent): boolean {
  return consent.userId === event.userId && consent.signal === event.signal && consent.state === 'GRANTED' && consent.receiptId === event.consentReceiptId;
}

export const mobilityMediaPolicy = {
  onDeviceFirst: true,
  rawPersonalDataSaleAllowed: false,
  externalRawLocationExportAllowed: false,
  emotionInferenceDiagnostic: false,
  emotionInferenceHighStakesAllowed: false,
  requiresUserVisibleControls: true,
  requiresRevocation: true,
};
