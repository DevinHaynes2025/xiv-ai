-- 62L-EN (#158) Deal & Contract Intelligence OS — candidate schema only.
-- Status: NOT_APPLIED. DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
-- Do not apply to live Supabase. No overload of production tables.

-- Candidate: deal/opportunity home objects (EN1 precursor surface)
-- CREATE TABLE IF NOT EXISTS deal_intelligence_opportunities_candidate (
--   opportunity_id text PRIMARY KEY,
--   kind text NOT NULL,
--   title text NOT NULL,
--   status text NOT NULL,
--   org_id text NOT NULL,
--   tenant_id text NOT NULL,
--   universe_id text NOT NULL,
--   flow_position text NOT NULL,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );

-- Candidate: negotiation lessons with provenance (structured evidence only)
-- CREATE TABLE IF NOT EXISTS historical_negotiation_lessons_candidate (
--   lesson_id text PRIMARY KEY,
--   title text NOT NULL,
--   domain text NOT NULL,
--   provenance text NOT NULL,
--   lesson_summary text NOT NULL,
--   proves_strategy_works_today boolean NOT NULL DEFAULT false,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );

SELECT '62L_EN_DEAL_CONTRACT_INTELLIGENCE_OS_CANDIDATES_NOT_APPLIED' AS status;
