-- Migration v8: User Intent, Education Level, and Trade Profile
-- Aligns users table with SIH PS 26092 Onboarding Intent Requirements

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS education_level TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trade_category TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS funding_bracket TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS caste_category TEXT DEFAULT 'SC';

COMMIT;
