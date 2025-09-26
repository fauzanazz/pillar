-- Migration: Add Risk field to contracts table
-- This field will store the complete risk scan results as JSON

-- Add the Risk column as JSONB for efficient querying
ALTER TABLE contracts 
ADD COLUMN risk_data JSONB;

-- Add an index on risk_data for efficient queries
CREATE INDEX IF NOT EXISTS idx_contracts_risk_data_gin ON contracts USING GIN (risk_data);

-- Add a partial index for contracts with risks
CREATE INDEX IF NOT EXISTS idx_contracts_with_risks ON contracts (id) WHERE risk_data IS NOT NULL;

-- Add a comment explaining the field
COMMENT ON COLUMN contracts.risk_data IS 'JSON field containing risk scan results including contract info and identified risks';

-- Example of the JSON structure that will be stored:
-- {
--   "contract": {
--     "id": "contract_id",
--     "title": "Contract Title",
--     "file": "contract_file.json"
--   },
--   "risks": [
--     {
--       "risk_type": "deadline_expiry",
--       "risk_level": "critical",
--       "risk_score": 90,
--       "description": "Contract has already expired",
--       "clause_reference": null,
--       "recommendation": "Urgent action required to renew or extend contract",
--       "deadline": "2025-01-01"
--     }
--   ],
--   "scan_metadata": {
--     "scanned_at": "2025-09-27T02:11:13Z",
--     "total_risks": 3,
--     "high_risk_count": 0,
--     "critical_risk_count": 1,
--     "overall_risk_score": 78
--   }
-- }