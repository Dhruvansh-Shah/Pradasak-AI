-- Schema v5: Add verification_status to partners table and seed 6 Additional SFBs idempotently

ALTER TABLE partners ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';

-- Ensure existing 91 partners have 'verified' status
UPDATE partners SET verification_status = 'verified' WHERE verification_status IS NULL;

-- Insert 6 Additional Small Finance Banks if not already present
INSERT INTO partners (
  name, partner_type, address, city, district, state, pin_code,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, verification_status, is_active
)
SELECT
  'ESAF Small Finance Bank – Thrissur HO', 'Small_Finance_Bank',
  'Building No. XIV/50, ESAF Bhavan, Mannuthy, Thrissur', 'Thrissur', 'Thrissur', 'Kerala', '680651',
  '0487-7123456', 'customercare@esafbank.com', 'https://www.esafbank.com',
  ST_GeographyFromText('SRID=4326;POINT(76.2673 10.5303)'),
  ARRAY['micro_finance','term_loan'], 2.8, 55.0, 'additional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name ILIKE '%ESAF%');

INSERT INTO partners (
  name, partner_type, address, city, district, state, pin_code,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, verification_status, is_active
)
SELECT
  'Suryoday Small Finance Bank – Navi Mumbai HO', 'Small_Finance_Bank',
  '1101, Sharda Terraces, Plot No. 65, Sector 11, CBD Belapur, Navi Mumbai', 'Navi Mumbai', 'Thane', 'Maharashtra', '400614',
  '022-71243333', 'smile@suryodaybank.com', 'https://www.suryodaybank.com',
  ST_GeographyFromText('SRID=4326;POINT(73.0375 19.0202)'),
  ARRAY['micro_finance','term_loan'], 3.2, 58.0, 'additional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name ILIKE '%Suryoday%');

INSERT INTO partners (
  name, partner_type, address, city, district, state, pin_code,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, verification_status, is_active
)
SELECT
  'Utkarsh Small Finance Bank – Varanasi HO', 'Small_Finance_Bank',
  'Utkarsh Tower, S-24/1-2, First Floor, Mahavir Mandir Road, Orderly Bazar, Varanasi', 'Varanasi', 'Varanasi', 'Uttar Pradesh', '221002',
  '0542-6605555', 'customercare@utkarsh.bank', 'https://www.utkarsh.bank',
  ST_GeographyFromText('SRID=4326;POINT(82.9739 25.3176)'),
  ARRAY['micro_finance','term_loan'], 3.0, 56.0, 'additional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name ILIKE '%Utkarsh%');

INSERT INTO partners (
  name, partner_type, address, city, district, state, pin_code,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, verification_status, is_active
)
SELECT
  'Shivalik Small Finance Bank – Noida Corporate Office', 'Small_Finance_Bank',
  'Plot No. A-12, Sector 60, Noida', 'Noida', 'Gautam Buddha Nagar', 'Uttar Pradesh', '201301',
  '0120-4050000', 'reachus@shivalikbank.com', 'https://shivalikbank.com',
  ST_GeographyFromText('SRID=4326;POINT(77.3699 28.5997)'),
  ARRAY['micro_finance','term_loan'], 3.4, 60.0, 'additional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name ILIKE '%Shivalik%');

INSERT INTO partners (
  name, partner_type, address, city, district, state, pin_code,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, verification_status, is_active
)
SELECT
  'Unity Small Finance Bank – Mumbai HO', 'Small_Finance_Bank',
  'Centrum House, CST Road, Vidyanagari Marg, Kalina, Santacruz East, Mumbai', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400098',
  '022-42159000', 'care@unitybank.co.in', 'https://theunitybank.com',
  ST_GeographyFromText('SRID=4326;POINT(72.8683 19.0732)'),
  ARRAY['micro_finance','term_loan'], 2.9, 54.0, 'additional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name ILIKE '%Unity%');

INSERT INTO partners (
  name, partner_type, address, city, district, state, pin_code,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, verification_status, is_active
)
SELECT
  'North East Small Finance Bank – Guwahati HO', 'Small_Finance_Bank',
  '1st Floor, Subham Velox, GS Road, Dispur, Guwahati', 'Guwahati', 'Kamrup Metropolitan', 'Assam', '781006',
  '0361-7180000', 'customercare@nesfb.com', 'https://www.nesfb.com',
  ST_GeographyFromText('SRID=4326;POINT(91.7898 26.1420)'),
  ARRAY['micro_finance','term_loan'], 3.5, 59.0, 'additional', TRUE
WHERE NOT EXISTS (SELECT 1 FROM partners WHERE name ILIKE '%North East Small%');
