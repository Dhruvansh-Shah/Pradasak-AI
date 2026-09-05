-- Migration v6: Scheme Catalogue Refinement (Exactly 14 Unique Schemes, Corrected Women Only Eligibility)
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS scheme_type TEXT DEFAULT 'financing';
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS official_source TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS official_source_url TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS aliases TEXT[];
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS current_official_name TEXT;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS channel_partner_applicable BOOLEAN DEFAULT TRUE;
ALTER TABLE schemes ADD COLUMN IF NOT EXISTS gender_eligibility TEXT DEFAULT 'all';

-- Clear existing schemes and seed EXACTLY 14 unique schemes
TRUNCATE schemes RESTART IDENTITY CASCADE;

INSERT INTO schemes (
  id, name, category, description,
  max_income_lakh, min_loan_lakh, max_loan_lakh,
  interest_rate_min, interest_rate_max,
  moratorium_months_min, moratorium_months_max,
  max_tenure_months, coverage_percent,
  eligible_project_types, education_required, gender_eligibility, notes,
  scheme_type, official_source, official_source_url, aliases, current_official_name, channel_partner_applicable
) VALUES

-- 1. Micro Credit Finance (MCF)
(
  1,
  'Micro Credit Finance (MCF)',
  'micro_finance',
  'Provides small loans to SC individuals for income-generating activities for projects costing up to ₹1.40 lakh. Routed through SCAs and NBFC-MFIs.',
  3.00, 0.10, 1.25,
  6.50, 6.50,
  3, 3,
  36, 90,
  ARRAY['small_trade','handicraft','animal_husbandry','agriculture','tailoring','beauty_services','food_processing','repair_services','petty_shop'],
  FALSE, 'all',
  'NSFDC lends to SCA @ 2.5%; SCA lends to beneficiary @ 6.5%. Repayment in quarterly instalments within 3 years including 3-month moratorium.',
  'financing',
  'National Scheduled Castes Finance and Development Corporation (NSFDC)',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Micro Credit Finance', 'MCF', 'MFS', 'Micro Finance Scheme'],
  NULL,
  TRUE
),

-- 2. Mahila Samriddhi Yojana (MSY)
(
  2,
  'Mahila Samriddhi Yojana (MSY)',
  'micro_finance',
  'Exclusive micro-credit scheme for SC women for small income-generating activities. Offered through SCAs and SHGs at a highly subsidised rate.',
  3.00, 0.05, 1.25,
  4.00, 4.00,
  3, 6,
  42, 90,
  ARRAY['small_trade','tailoring','beauty_services','handicraft','food_processing','dairy','petty_shop','incense_making','pickle_making','weaving'],
  FALSE, 'women_only',
  'WOMEN ONLY. NSFDC lends to SCA @ 1%; SCA lends to beneficiary @ 4%. Interest rebate of 0.5% for timely repayment.',
  'financing',
  'NSFDC & Ministry of Social Justice and Empowerment',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Mahila Samriddhi Yojana', 'MSY', 'Mahila Samriddhi'],
  NULL,
  TRUE
),

-- 3. Mahila Adhikarita Yojana (MAY)
(
  3,
  'Mahila Adhikarita Yojana (MAY)',
  'entrepreneurship',
  'Concessional micro-credit scheme for SC women entrepreneurs and women farmers (formerly Mahila Kisan Yojana) to pursue agricultural, allied, and micro-business activities.',
  3.00, 0.10, 2.00,
  5.00, 5.00,
  12, 12,
  120, 90,
  ARRAY['agriculture','horticulture','mixed_farming','dairy','poultry','fisheries','animal_husbandry','sericulture'],
  FALSE, 'women_only',
  'WOMEN ONLY. Officially represented as Mahila Adhikarita Yojana (MAY) for SC women in agriculture & enterprise.',
  'financing',
  'Ministry of Social Justice & Empowerment / NSFDC',
  'https://dosje.gov.in',
  ARRAY['Mahila Kisan Yojana', 'MKY', 'MAY', 'Mahila Kisan', 'Mahila Adhikarita'],
  NULL,
  TRUE
),

-- 4. Shilpi Samriddhi Yojana (SSY)
(
  4,
  'Shilpi Samriddhi Yojana (SSY)',
  'term_loan',
  'Financial assistance for SC artisans (with priority for women artisans) for purchasing tools, raw materials, and setting up workshops. Requires an Artisan Identity Card issued by Ministry of Textiles or State Govt.',
  3.00, 0.10, 2.00,
  5.00, 5.00,
  6, 6,
  72, 90,
  ARRAY['handicraft','weaving','pottery','wood_work','metal_craft','leather_craft','textile','bamboo_craft','stone_craft','embroidery','carpet_making'],
  FALSE, 'women_only',
  'ARTISANS & WOMEN ARTISANS. Artisan Identity Card mandatory. NSFDC lends to SCA @ 2%; SCA charges beneficiary @ 5%.',
  'financing',
  'NSFDC & Ministry of Textiles',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Shilpi Samriddhi Yojana', 'Shishu Samriddhi Yojana', 'SSY', 'Shilpi Samriddhi'],
  NULL,
  TRUE
),

-- 5. Term Loan (TL)
(
  5,
  'Term Loan (TL)',
  'entrepreneurship',
  'Flagship large project loan for SC entrepreneurs to set up or expand income-generating enterprises in agriculture, manufacturing, services, and allied sectors up to ₹50 lakh. (Includes historical Utkarsh Loan category).',
  5.00, 0.10, 45.00,
  6.00, 8.00,
  6, 12,
  120, 90,
  ARRAY['agriculture','dairy','poultry','fisheries','manufacturing','transport','flour_mill','rice_mill','grocery_wholesale','hardware','automobile_repair','construction','food_processing','hotel_restaurant','beauty_parlour','clinic','cold_storage','petrol_pump'],
  FALSE, 'all',
  'Flagship loan scheme. NSFDC charges 4% to SCAs/CAs; beneficiaries pay 8.0%. Units costing up to ₹50 lakh; max loan ₹45 lakh (90%).',
  'financing',
  'National Scheduled Castes Finance and Development Corporation (NSFDC)',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Term Loan', 'TL', 'Term Loan Scheme', 'Utkarsh Loan', 'Utkarsh Loan Scheme', 'Utkarsh'],
  NULL,
  TRUE
),

-- 6. Green Business Scheme (GBS)
(
  6,
  'Green Business Scheme (GBS)',
  'entrepreneurship',
  'Loan for SC entrepreneurs to set up environment-friendly, climate-resilient businesses including electric vehicles (e-rickshaws), solar energy products, organic farming, and bio-gas.',
  5.00, 0.10, 27.00,
  4.00, 7.00,
  6, 6,
  120, 90,
  ARRAY['electric_vehicle','e_rickshaw','solar_energy','organic_farming','poly_house','biogas','vermicompost','renewable_energy','compressed_air_vehicle','eco_tourism','waste_recycling'],
  FALSE, 'all',
  'Concessional interest rate for green & eco-friendly activities. Max project cost ₹30 lakh; loan up to 90%.',
  'financing',
  'NSFDC & Ministry of Social Justice and Empowerment',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Green Business Scheme', 'GBS', 'Green Business'],
  NULL,
  TRUE
),

-- 7. Swachhta Udyami Yojana (SUY)
(
  7,
  'Swachhta Udyami Yojana (SUY)',
  'entrepreneurship',
  'Loan scheme under Swachh Bharat Mission specifically for SC communities and safai karamcharis to set up sanitation enterprises, mechanized cleaning, and suction machinery.',
  3.00, 0.10, 13.50,
  4.00, 4.00,
  6, 6,
  120, 90,
  ARRAY['sanitation_enterprise','waste_collection','waste_recycling','toilet_construction','sewage_cleaning_machinery','garbage_transport','bio_toilet','laundry_laundromat'],
  FALSE, 'all',
  'Targeted for safai karamcharis & manual scavengers under Swachh Bharat Mission. Beneficiary rate 4.0% p.a.',
  'financing',
  'NSFDC & Swachh Bharat Mission (MoSJE)',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Swachhta Udyami Yojana', 'SUY', 'Swachhta Udyami'],
  NULL,
  TRUE
),

-- 8. Udyam Nidhi Yojana (UNY)
(
  8,
  'Udyam Nidhi Yojana (UNY)',
  'entrepreneurship',
  'Loan routed through Cooperative Societies, Cooperative Banks, and Small Finance Banks (SFBs) for SC individuals for small and micro business activities up to ₹5.00 lakh. (Includes historical Laghu Vyavasaya Yojana / LVY).',
  3.00, 0.10, 4.50,
  13.00, 15.00,
  3, 3,
  60, 90,
  ARRAY['small_trade','micro_enterprise','handicraft','agriculture','petty_shop','repair_services','services','manufacturing_small'],
  FALSE, 'all',
  'Routed EXCLUSIVELY through Cooperative Banks (13% interest) and Small Finance Banks (15% interest). Max loan ₹4.50 lakh.',
  'financing',
  'National Scheduled Castes Finance and Development Corporation (NSFDC)',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Udyam Nidhi Yojana', 'UNY', 'Udyam Nidhi', 'Laghu Vyavasaya Yojana', 'LVY', 'Laghu Vyavasaya'],
  NULL,
  TRUE
),

-- 9. Aajeevika Microfinance Yojana (AMY)
(
  9,
  'Aajeevika Microfinance Yojana (AMY)',
  'micro_finance',
  'Micro-credit for SC individuals provided through selected NBFC-MFIs to pursue small and micro business activities for projects costing up to ₹1.40 lakh.',
  3.00, 0.05, 1.25,
  15.00, 15.00,
  3, 3,
  36, 90,
  ARRAY['small_trade','micro_enterprise','handicraft','petty_shop','animal_husbandry','repair_services','food_processing','tailoring'],
  FALSE, 'all',
  'Routed EXCLUSIVELY through selected NBFC-MFIs. Beneficiary rate 15% p.a. (NSFDC charges NBFC-MFI 5%).',
  'financing',
  'National Scheduled Castes Finance and Development Corporation (NSFDC)',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Aajeevika Microfinance Yojana', 'AMY', 'Aajeevika Micro-Finance'],
  NULL,
  TRUE
),

-- 10. Educational Loan Scheme (ELS)
(
  10,
  'Educational Loan Scheme (ELS)',
  'education_loan',
  'Covers tuition fees, hostel charges, books, and equipment for SC students pursuing full-time professional or technical recognized courses in India or abroad up to ₹40.00 lakh.',
  5.00, 0.10, 40.00,
  6.50, 6.50,
  12, 12,
  144, 90,
  ARRAY['education','engineering','medicine','dentistry','management','law','architecture','nursing','hotel_management','pharmacy','it_courses','doctoral_studies','ca_icwa','pilot_training','mba','mca'],
  TRUE, 'all',
  'Max loan ₹40.00 lakh or 90% of course fee. Beneficiary interest rate 6.5% p.a. Moratorium = course duration + 1 year.',
  'financing',
  'National Scheduled Castes Finance and Development Corporation (NSFDC)',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Educational Loan Scheme', 'ELS', 'Education Loan'],
  NULL,
  TRUE
),

-- 11. Vocational Education & Training Loan Scheme (VETLS)
(
  11,
  'Vocational Education & Training Loan Scheme (VETLS)',
  'education_loan',
  'Loan for SC youth to pursue non-degree vocational and skill-development courses (duration 6 months to 2 years) from ITIs, polytechnics, and recognized skill training institutes up to ₹4.00 lakh.',
  5.00, 0.05, 4.00,
  4.00, 4.00,
  6, 12,
  84, 90,
  ARRAY['vocational_training','skill_development','iti_courses','polytechnic','computer_training','beautician_course','electrician','plumbing','carpentry','motor_mechanic','welding','nursing_aide','data_entry'],
  TRUE, 'all',
  'Loan up to ₹4.00 lakh for vocational skill courses. Interest @ 4.0% p.a. Repayment over 7 years.',
  'financing',
  'NSFDC & Ministry of Social Justice and Empowerment',
  'https://nsfdc.nic.in/scheme',
  ARRAY['Vocational Education & Training Loan Scheme', 'VETLS', 'Vocational Loan'],
  NULL,
  TRUE
),

-- 12. PM-DAKSH Skill Development Programme
(
  12,
  'PM-DAKSH Skill Development Programme',
  'skill_development',
  '100% free government skill development training programme implemented by MoSJE through NSFDC, NBCFDC, and NSKFDC. Provides free upskilling/reskilling training and stipends to SC youth; not a loan scheme.',
  5.00, 0.00, 0.00,
  0.00, 0.00,
  0, 0,
  0, 0,
  ARRAY['skill_development','vocational_training','reskilling','upskilling','stipend_training'],
  FALSE, 'all',
  'INFORMATIONAL PROGRAMME ONLY. Free skill training & stipend program under pmdaksh.dosje.gov.in. Not a loan scheme and not routed to financial channel partners.',
  'informational',
  'Ministry of Social Justice and Empowerment (MoSJE)',
  'https://pmdaksh.dosje.gov.in',
  ARRAY['PM-DAKSH', 'PM DAKSH', 'Pradhan Mantri Dakshta', 'Skill Development Training'],
  NULL,
  FALSE
),

-- 13. SMILE (Support for Marginalized Individuals)
(
  13,
  'SMILE (Support for Marginalized Individuals)',
  'other_programme',
  'Official umbrella welfare and rehabilitation programme by MoSJE for marginalized individuals, including transgender persons and persons engaged in act of begging. Provides welfare information and support; not part of the NSFDC channel-partner loan routing flow.',
  5.00, 0.00, 0.00,
  0.00, 0.00,
  0, 0,
  0, 0,
  ARRAY['rehabilitation','welfare','transgender_support','livelihood_support','social_security'],
  FALSE, 'all',
  'INFORMATIONAL PROGRAMME ONLY. Implemented directly by MoSJE welfare departments. Not part of NSFDC financial channel partner loan routing flow.',
  'informational',
  'Ministry of Social Justice and Empowerment (MoSJE)',
  'https://dosje.gov.in',
  ARRAY['SMILE', 'SMILE Scheme', 'Support for Marginalized Individuals'],
  NULL,
  FALSE
),

-- 14. Stand-Up India Scheme
(
  14,
  'Stand-Up India Scheme',
  'entrepreneurship',
  'National Government of India initiative launched by the Ministry of Finance / SIDBI to facilitate bank loans between ₹10 lakh and ₹1 crore to SC/ST and women borrowers for greenfield enterprises. Disbursed directly by Scheduled Commercial Banks.',
  5.00, 10.00, 100.00,
  8.00, 10.00,
  6, 18,
  84, 85,
  ARRAY['greenfield_enterprise','manufacturing','services','trading','agri_allied'],
  FALSE, 'all',
  'INFORMATIONAL PROGRAMME ONLY. Inter-ministerial scheme disbursed by Scheduled Commercial Banks via standupmitra.in. Not an NSFDC-exclusive channel partner loan scheme.',
  'informational',
  'Ministry of Finance / SIDBI',
  'https://standupmitra.in',
  ARRAY['Stand-Up India', 'Standup India', 'Stand Up India'],
  NULL,
  FALSE
);
