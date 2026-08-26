-- Enable PostGIS for geo-spatial partner queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Schemes / grants catalog
-- This is the ONLY table the LLM-generated SQL is allowed to query
CREATE TABLE IF NOT EXISTS schemes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,           -- 'micro_finance' | 'term_loan' | 'education_loan'
  description TEXT,
  min_income_lakh NUMERIC,          -- minimum family income eligibility (null = no floor)
  max_income_lakh NUMERIC NOT NULL, -- maximum family annual income in Lakhs (e.g. 5.00)
  min_loan_lakh NUMERIC,
  max_loan_lakh NUMERIC NOT NULL,   -- e.g. 1.40 for Micro Finance, 50.00 for Term Loan
  interest_rate_min NUMERIC NOT NULL,
  interest_rate_max NUMERIC NOT NULL,
  moratorium_months_min INT NOT NULL,
  moratorium_months_max INT NOT NULL,
  max_tenure_months INT NOT NULL,
  coverage_percent NUMERIC,         -- e.g. 90 (%)
  eligible_project_types TEXT[],    -- ['agriculture', 'handicraft', 'small_trade', ...]
  education_required BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Channel Partners (SCAs, PSBs, RRBs, NBFC-MFIs)
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  partner_type TEXT NOT NULL,       -- 'SCA' | 'PSB' | 'RRB' | 'NBFC_MFI'
  address TEXT,
  city TEXT,
  state TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  eligible_categories TEXT[],       -- which scheme categories this partner can process
  npa_percent NUMERIC,              -- NPA % (lower is healthier); NULL = unknown
  fund_utilization_percent NUMERIC, -- fund utilization % (below ~85 = has headroom); NULL = unknown
  is_active BOOLEAN DEFAULT TRUE
);

-- Spatial index for fast nearest-partner queries
CREATE INDEX IF NOT EXISTS partners_location_idx ON partners USING GIST(location);
