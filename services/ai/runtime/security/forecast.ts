import type { SecurityEventKind } from './feedback';

export type ForecastStance = 'observed' | 'suspected' | 'projected';

export type AttackForecast = {
  kind: SecurityEventKind;
  stance: ForecastStance;
  detected: false;
  reason: string;
};

export function forecastAttack(kind: SecurityEventKind, stance: ForecastStance): AttackForecast {
  return {
    kind,
    stance,
    detected: false,
    reason: 'Foresight is architectural. No fake detections are emitted.',
  };
}

export function forecastIsDetection(forecast: AttackForecast) {
  return forecast.detected;
}
