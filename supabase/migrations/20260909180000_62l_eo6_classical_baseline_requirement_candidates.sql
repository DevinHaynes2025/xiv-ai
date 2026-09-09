-- 62L-EO6 Classical Baseline Requirement — candidate schema only.
-- Status: NOT_APPLIED. DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
-- Do not apply to live Supabase. No overload of production tables.
-- Critical: no auto-promote without measured advantage; tradeoff honesty required.

-- Candidate: classical baseline comparison / promotion gate evidence records
-- CREATE TABLE IF NOT EXISTS classical_baseline_comparison_candidate (
--   evidence_id text PRIMARY KEY,
--   problem_id text NOT NULL,
--   objective_function text NOT NULL,
--   dataset_version text NOT NULL,
--   baseline_algorithms jsonb NOT NULL DEFAULT '[]'::jsonb,
--   advanced_candidate_algorithms jsonb NOT NULL DEFAULT '[]'::jsonb,
--   evaluation_metrics jsonb NOT NULL DEFAULT '[]'::jsonb,
--   compute_budget text,
--   runtime_budget text,
--   reproducibility_seed bigint NOT NULL,
--   test_environment text,
--   evidence_owner text NOT NULL,
--   observations jsonb NOT NULL DEFAULT '[]'::jsonb,
--   tradeoff_improved jsonb NOT NULL DEFAULT '[]'::jsonb,
--   tradeoff_worsened jsonb NOT NULL DEFAULT '[]'::jsonb,
--   tradeoff_narrative text NOT NULL,
--   promotion_outcome text NOT NULL,
--   auto_promoted boolean NOT NULL DEFAULT false,
--   promoted boolean NOT NULL DEFAULT false,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );

SELECT '62L_EO6_CLASSICAL_BASELINE_REQUIREMENT_CANDIDATES_NOT_APPLIED' AS status;
