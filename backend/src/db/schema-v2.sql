-- Schema v2: add columns needed for full conversational platform

-- schemes: add new fields
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS short_name TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS gender_eligibility TEXT DEFAULT 'all';
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS age_min INT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS age_max INT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS documents_required TEXT[];
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS channel_partner_types TEXT[];
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS min_tenure_months INT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'official';
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS last_updated DATE DEFAULT CURRENT_DATE;

-- partners: add new fields
ALTER TABLE partners ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE partners ADD COLUMN IF NOT EXISTS fund_availability_status TEXT DEFAULT 'available';
ALTER TABLE partners ADD COLUMN IF NOT EXISTS eligible_schemes TEXT[];

-- Backfill defaults
UPDATE schemes SET active = TRUE WHERE active IS NULL;
UPDATE schemes SET gender_eligibility = 'all' WHERE gender_eligibility IS NULL;

-- Mahila / women-only schemes
UPDATE schemes SET gender_eligibility = 'women_only'
WHERE name ILIKE '%mahila%' OR name ILIKE '%women%' OR notes ILIKE '%WOMEN ONLY%';

-- Set fund_availability_status based on utilization
UPDATE partners SET fund_availability_status =
  CASE
    WHEN fund_utilization_percent IS NULL THEN 'available'
    WHEN fund_utilization_percent >= 85 THEN 'limited'
    WHEN fund_utilization_percent >= 95 THEN 'exhausted'
    ELSE 'available'
  END
WHERE fund_availability_status IS NULL OR fund_availability_status = 'available';

-- Set default documents for schemes
UPDATE schemes SET documents_required = ARRAY[
  'Aadhaar Card',
  'SC Caste Certificate',
  'Income Certificate',
  'Bank Account Passbook',
  'Passport-size Photographs',
  'Project/Business Plan or Quotation'
] WHERE documents_required IS NULL;

-- Education schemes get extra docs
UPDATE schemes SET documents_required = array_cat(documents_required, ARRAY[
  'Admission Letter / Fee Receipt',
  'Educational Certificates (10th, 12th marksheets)',
  'Institution Bonafide Certificate'
]) WHERE category = 'education_loan' AND documents_required IS NOT NULL;

-- Set channel_partner_types per category
UPDATE schemes SET channel_partner_types = ARRAY['SCA', 'NBFC_MFI']
WHERE category = 'micro_finance' AND channel_partner_types IS NULL;

UPDATE schemes SET channel_partner_types = ARRAY['SCA', 'PSB', 'RRB']
WHERE category = 'term_loan' AND channel_partner_types IS NULL;

UPDATE schemes SET channel_partner_types = ARRAY['PSB', 'RRB', 'SCA']
WHERE category = 'education_loan' AND channel_partner_types IS NULL;
