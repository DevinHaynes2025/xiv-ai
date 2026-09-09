export type ScaleEvidenceStatus = 'not_tested' | 'partial' | 'validated';

export type ScaleEvidenceId =
  | 'api_scale'
  | 'db_scale'
  | 'queue_scale'
  | 'regional_failover'
  | 'cache_isolation'
  | 'rate_limiting'
  | 'incident_recovery'
  | 'tenant_isolation'
  | 'load_shedding';

export type ScaleScorecard = Record<ScaleEvidenceId, ScaleEvidenceStatus>;

export function scaleReadinessScorecard(): ScaleScorecard {
  return {
    api_scale: 'not_tested',
    db_scale: 'not_tested',
    queue_scale: 'not_tested',
    regional_failover: 'not_tested',
    cache_isolation: 'not_tested',
    rate_limiting: 'not_tested',
    incident_recovery: 'not_tested',
    tenant_isolation: 'not_tested',
    load_shedding: 'not_tested',
  };
}

export function scaleEvidenceNumericScore() {
  return null;
}
