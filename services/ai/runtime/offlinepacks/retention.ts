/**
 * 62L-EX14 — Beneficial retention scoring + Iceberg tier metaphor.
 */

import {
  retentionToIceberg,
  type BeneficialRetentionScore,
  type NormalizedRecord,
  type RetentionTier,
} from './types.ts';

export function scoreBeneficialRetention(record: NormalizedRecord): BeneficialRetentionScore {
  let score = 0.35;
  const reasons: string[] = [];

  if (record.claimFactState === 'FACT_SUPPORTED') {
    score += 0.25;
    reasons.push('fact_supported');
  } else if (record.claimFactState === 'HYPOTHESIS') {
    score += 0.05;
    reasons.push('hypothesis_low_weight');
  } else if (record.claimFactState === 'OUTDATED' || record.claimFactState === 'DISPUTED') {
    score -= 0.15;
    reasons.push('outdated_or_disputed');
  }

  if (record.kind === 'Lesson' || record.kind === 'Failure') {
    score += 0.15;
    reasons.push('lesson_or_failure_memory');
  }
  if (record.kind === 'Benchmark') {
    score += 0.1;
    reasons.push('benchmark_reference');
  }
  if (record.historicalCase) {
    score += 0.1;
    reasons.push('historical_case_memory');
  }
  if (record.bytes > 50_000) {
    score -= 0.05;
    reasons.push('large_payload_cold_bias');
  }

  score = Math.max(0, Math.min(1, score));
  const tier = tierFromScore(score, record);
  return {
    recordId: record.recordId,
    score,
    tier,
    icebergTier: retentionToIceberg(tier),
    reasons,
  };
}

function tierFromScore(score: number, record: NormalizedRecord): RetentionTier {
  if (record.claimFactState === 'OUTDATED' && score < 0.25) return 'REVIEW_FOR_DELETE';
  if (score >= 0.75) return 'HOT';
  if (score >= 0.55) return 'WARM';
  if (score >= 0.35) return 'COLD';
  return 'ARCHIVE';
}

export function revokeRetention(recordId: string): BeneficialRetentionScore {
  return {
    recordId,
    score: 0,
    tier: 'REVOKED',
    icebergTier: 'CALVED_REVOKED',
    reasons: ['revoked'],
  };
}
