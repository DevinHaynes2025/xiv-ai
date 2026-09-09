-- 62L-EO9 Digital Product Contract Pack — candidate schema only.
-- Status: NOT_APPLIED. DOCUMENTED ≠ IMPLEMENTED ≠ VERIFIED ≠ PRODUCTION AUTHORIZED.
-- Do not apply to live Supabase. No overload of production tables.
-- No FedRAMP/FISMA/CMMC/clearance/agency auth/production readiness claim.

-- Candidate: digital solution records (contract surface)
-- CREATE TABLE IF NOT EXISTS digital_product_solution_records_candidate (
--   requirement_id text PRIMARY KEY,
--   product_module text NOT NULL,
--   deployment_model text NOT NULL,
--   deployment_claim_state text NOT NULL,
--   evidence_state text NOT NULL,
--   org_id text NOT NULL,
--   tenant_id text NOT NULL,
--   universe_id text NOT NULL,
--   workflow_position text NOT NULL,
--   created_at timestamptz NOT NULL DEFAULT now()
-- );

-- Candidate: acceptance checklist rows
-- CREATE TABLE IF NOT EXISTS digital_product_acceptance_checklist_candidate (
--   checklist_id text NOT NULL,
--   requirement_id text NOT NULL,
--   item text NOT NULL,
--   status text NOT NULL,
--   note text NOT NULL,
--   PRIMARY KEY (checklist_id, item)
-- );

SELECT '62L_EO9_DIGITAL_PRODUCT_CONTRACT_PACK_CANDIDATES_NOT_APPLIED' AS status;
