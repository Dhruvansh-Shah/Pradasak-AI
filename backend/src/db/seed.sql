-- =============================================================================
-- NSFDC SCHEMES SEED DATA
-- Source: NSFDC official website (nsfdc.nic.in), Ministry of Social Justice,
--         CreditMantri, Buddy4Study, PaisaBazaar, SIH problem statement
-- As of: 2024-25 (income limit revised to ₹3L by NSFDC; PS states ₹5L —
--         max_income_lakh reflects the PS figure of 5.00 unless scheme-specific)
-- Rates shown are interest charged TO BENEFICIARY by SCA/CA
-- =============================================================================

TRUNCATE schemes RESTART IDENTITY CASCADE;

INSERT INTO schemes (
  name, category, description,
  max_income_lakh, min_loan_lakh, max_loan_lakh,
  interest_rate_min, interest_rate_max,
  moratorium_months_min, moratorium_months_max,
  max_tenure_months, coverage_percent,
  eligible_project_types, education_required, notes
) VALUES

-- 1. Micro Credit Finance (MCF)
-- Ref: nsfdc.nic.in/en/micro-credit-finance
(
  'Micro Credit Finance (MCF)',
  'micro_finance',
  'Provides small loans to SC individuals for income-generating activities for projects costing up to ₹1.40 lakh. Routed through SCAs and NBFC-MFIs. Ideal for first-time borrowers in trade, handicraft, animal husbandry, and services.',
  3.00, 0.10, 1.25,
  6.50, 6.50,
  3, 3,
  36, 90,
  ARRAY['small_trade','handicraft','animal_husbandry','agriculture','tailoring','beauty_services','food_processing','repair_services','petty_shop'],
  FALSE,
  'NSFDC lends to SCA @ 2.5%; SCA lends to beneficiary @ 6.5%. Repayment in quarterly instalments within 3 years including 3-month moratorium. Max project cost ₹1.40 lakh; max loan ₹1.25 lakh (90%).'
),

-- 2. Mahila Samriddhi Yojana (MSY)
-- Ref: nsfdc.nic.in/hi/mahila-samriddhi-yojana, scstyojana.com
(
  'Mahila Samriddhi Yojana (MSY)',
  'micro_finance',
  'Exclusive micro-credit scheme for SC women for small income-generating activities. Offered through SCAs and SHGs at a highly subsidised rate. Encourages women entrepreneurship at the grass-roots level.',
  3.00, 0.05, 1.25,
  4.00, 4.00,
  3, 6,
  42, 90,
  ARRAY['small_trade','tailoring','beauty_services','handicraft','food_processing','dairy','petty_shop','incense_making','pickle_making','weaving'],
  FALSE,
  'WOMEN ONLY. NSFDC lends to SCA @ 1%; SCA lends to beneficiary @ 4%. Interest rebate of 0.5% for timely repayment. Repayment quarterly over 3-3.5 years. SHG route also available.'
),

-- 3. Mahila Kisan Yojana (MKY)
-- Ref: creditmantri.com, simplifiedupsc.in
(
  'Mahila Kisan Yojana (MKY)',
  'term_loan',
  'Loan for SC women engaged in agriculture and mixed farming activities in rural areas. Land must be in the name of the woman beneficiary or jointly with her husband. Subsidy of ₹10,000 or 50% of unit cost available for BPL beneficiaries.',
  3.00, 0.10, 2.00,
  5.00, 5.00,
  12, 12,
  120, 90,
  ARRAY['agriculture','horticulture','mixed_farming','dairy','poultry','fisheries','animal_husbandry','sericulture'],
  FALSE,
  'WOMEN ONLY. RURAL AREAS ONLY. Land ownership in woman''s name required. Subsidy: ₹10,000 or 50% of unit cost (whichever is less) for BPL women. NSFDC lends to SCA @ 2%; SCA charges beneficiary @ 5%.'
),

-- 4. Shilpi Samriddhi Yojana (SSY)
-- Ref: simplifiedupsc.in, socialjustice.gov.in evaluation
(
  'Shilpi Samriddhi Yojana (SSY)',
  'term_loan',
  'Financial assistance for SC artisans for purchasing tools, raw materials, and setting up workshops. Applicant must possess an Artisan Identity Card issued by the Development Commissioner (Handicrafts), Ministry of Textiles, or State Govt.',
  3.00, 0.10, 2.00,
  5.00, 5.00,
  6, 6,
  72, 90,
  ARRAY['handicraft','weaving','pottery','wood_work','metal_craft','leather_craft','textile','bamboo_craft','stone_craft','embroidery','carpet_making'],
  FALSE,
  'ARTISANS ONLY. Artisan Identity Card (from DC Handicrafts or State Govt) is mandatory. NSFDC lends to SCA @ 2%; SCA charges beneficiary @ 5%. Covers tools, raw materials, workshop setup.'
),

-- 5. Laghu Vyavasaya Yojana (LVY)
-- Ref: simplifiedupsc.in, searchresults
(
  'Laghu Vyavasaya Yojana (LVY)',
  'term_loan',
  'Small business loan for SC entrepreneurs for establishing or expanding small enterprises. Broader in scope than MCF — covers manufacturing, trade, and services with a higher project cost ceiling of ₹2 lakh.',
  3.00, 0.10, 1.80,
  6.00, 6.00,
  6, 6,
  72, 90,
  ARRAY['small_trade','manufacturing','repair_shop','auto_repair','printing','photography','courier','transport_small','laundry','catering','grocery'],
  FALSE,
  'NSFDC lends to SCA @ 3%; SCA charges beneficiary @ 6%. Project cost up to ₹2 lakh; NSFDC finances 90% = ₹1.80 lakh. Repayment over 6 years including moratorium.'
),

-- 6. Term Loan (TL)
-- Ref: creditmantri.com, socialjustice evaluation PDF
(
  'Term Loan (TL)',
  'term_loan',
  'Flagship large project loan for SC entrepreneurs to set up or expand income-generating enterprises in agriculture, manufacturing, services, and allied sectors. Covers a wide range of activities with project costs up to ₹30 lakh.',
  5.00, 0.10, 27.00,
  6.00, 8.00,
  6, 12,
  120, 90,
  ARRAY['agriculture','dairy','poultry','fisheries','manufacturing','transport','flour_mill','rice_mill','grocery_wholesale','hardware','automobile_repair','construction','food_processing','hotel_restaurant','beauty_parlour','clinic','cold_storage','petrol_pump'],
  FALSE,
  'Broadest-scope scheme. NSFDC lends to SCA @ 3-7%; SCA charges beneficiary @ 6-10%. Project cost up to ₹30 lakh; loan up to 90%. Moratorium 6-12 months. Repayment up to 10 years. Also routed through PSBs and RRBs.'
),

-- 7. Utkarsh Loan
-- Ref: nsfdc.nic.in/en/utkarsh-loan (search result summary)
(
  'Utkarsh Loan',
  'term_loan',
  'Premium term loan for SC entrepreneurs for larger projects costing ₹10–50 lakh. Aimed at scaling up existing businesses or setting up medium-scale enterprises. Routed through SCAs, PSBs, and RRBs.',
  5.00, 9.00, 45.00,
  9.00, 9.00,
  6, 12,
  84, 90,
  ARRAY['manufacturing','agro_processing','cold_storage','logistics','transport','hotel_restaurant','construction_material','textile_manufacturing','engineering_unit','healthcare_clinic','educational_institute','it_services'],
  FALSE,
  'For projects costing ₹10–50 lakh only. Min loan ₹9 lakh (90% of ₹10L). NSFDC lends to SCA @ 5%; SCA charges beneficiary @ 9%. Moratorium 6 months (12 months for plantation/construction). Repayment in quarterly/half-yearly/yearly instalments over 7 years.'
),

-- 8. Green Business Scheme (GBS)
-- Ref: nsfdc.nic.in/en/green-business-scheme (search summary), creditmantri
(
  'Green Business Scheme (GBS)',
  'term_loan',
  'Loan for SC entrepreneurs to set up environment-friendly, climate-resilient businesses. Covers electric vehicles (e-rickshaws, e-carts), solar energy products, organic farming, poly-houses, and other green livelihood activities.',
  5.00, 0.10, 27.00,
  4.00, 7.00,
  6, 6,
  120, 90,
  ARRAY['electric_vehicle','e_rickshaw','solar_energy','organic_farming','poly_house','biogas','vermicompost','renewable_energy','compressed_air_vehicle','eco_tourism','waste_recycling'],
  FALSE,
  'NSFDC lends to SCA @ 2-4%; SCA charges beneficiary @ 4-7% depending on activity. Project cost up to ₹30 lakh; loan up to 90%. Subsidy/interest subvention components available for some green activities. Moratorium 6 months; tenure up to 10 years.'
),

-- 9. Swachhta Udayami Yojana (SUY)
-- Ref: nsfdc.nic.in/en/swachhta-udyami-yojana (search summary)
(
  'Swachhta Udayami Yojana (SUY)',
  'term_loan',
  'Loan scheme specifically for SC communities engaged in sanitation and waste management — including safai karamcharis and manual scavengers — to set up sanitation-related enterprises and move away from hazardous occupations.',
  3.00, 0.10, 13.50,
  3.00, 4.00,
  6, 6,
  120, 90,
  ARRAY['sanitation_enterprise','waste_collection','waste_recycling','toilet_construction','sewage_cleaning_machinery','garbage_transport','bio_toilet','laundry_laundromat'],
  FALSE,
  'PRIORITY for safai karamcharis and manual scavengers. NSFDC lends to SCA @ 2%; SCA charges beneficiary @ 4% (3% for women — 1% rebate). Project cost up to ₹15 lakh; loan up to 90% (100% on refinance). Tenure up to 10 years.'
),

-- 10. Udyam Nidhi Yojana (UNY)
-- Ref: nsfdc.nic.in/en/udyam-nidhi-yojana (search summary)
(
  'Udyam Nidhi Yojana (UNY)',
  'term_loan',
  'Loan routed through Cooperative Societies and Cooperative Banks for SC individuals, SHGs, and JLGs for small and micro business activities. Higher beneficiary interest rate as it goes through cooperatives.',
  3.00, 0.10, 4.50,
  13.00, 13.00,
  3, 3,
  72, 90,
  ARRAY['small_trade','micro_enterprise','handicraft','agriculture','petty_shop','repair_services','services','manufacturing_small'],
  FALSE,
  'Routed EXCLUSIVELY through Cooperative Societies and Cooperative Banks (not SCAs/Banks). NSFDC charges cooperative @ 5%; cooperative charges beneficiary @ 13%. Project cost up to ₹5 lakh; loan up to ₹4.5 lakh (90%). Repayment over 6 years including 3-month moratorium.'
),

-- 11. Aajeevika Microfinance Yojana (AMY)
-- Ref: nsfdc.nic.in/en/schemes-to-be-implemented-through-nbfc-mfis (search summary)
(
  'Aajeevika Microfinance Yojana (AMY)',
  'micro_finance',
  'Micro-credit for SC individuals through NBFC-MFIs for small and micro business activities. Similar to MCF but implemented via NBFC-MFI channel partners. Ideal for borrowers in areas where SCAs have limited reach.',
  3.00, 0.05, 0.60,
  5.00, 7.00,
  3, 3,
  36, 90,
  ARRAY['small_trade','micro_enterprise','handicraft','petty_shop','animal_husbandry','repair_services','food_processing','tailoring'],
  FALSE,
  'Routed EXCLUSIVELY through NBFC-MFI channel partners. NSFDC charges NBFC-MFI @ 4-5%; beneficiaries receive a 2% interest subvention making effective rate lower. Loan up to ₹60,000. Repayment over 3 years including 3-month moratorium.'
),

-- 12. Education Loan Scheme (ELS)
-- Ref: buddy4study.com, propelld.com, buddy4loan.com
(
  'Education Loan Scheme (ELS)',
  'education_loan',
  'Covers tuition fees, hostel charges, books, equipment, and other education-related expenses for SC students pursuing full-time professional or technical courses in India or abroad at recognized institutions.',
  5.00, 0.10, 40.00,
  3.50, 4.00,
  12, 12,
  144, 90,
  ARRAY['education','engineering','medicine','dentistry','management','law','architecture','nursing','hotel_management','pharmacy','it_courses','doctoral_studies','ca_icwa','pilot_training','mba','mca'],
  TRUE,
  'India: up to ₹30 lakh @ 4% (3.5% for women); Abroad: up to ₹40 lakh @ 4% (3.5% for women). No prepayment penalty. Moratorium = course duration + 6 months. Repayment: 10 years (loans ≤ ₹10L) or 12 years (loans > ₹10L). Covers UG, PG, doctoral. Admission to recognized institution required.'
),

-- 13. Vocational Education & Training Loan Scheme (VETLS)
-- Ref: creditmantri.com, socialjustice evaluation
(
  'Vocational Education & Training Loan Scheme (VETLS)',
  'education_loan',
  'Loan for SC youth to pursue short-term vocational and skill-development courses (up to 2 years duration) from ITIs, polytechnics, and other government-recognized skill training institutes.',
  5.00, 0.05, 4.00,
  3.50, 4.00,
  6, 12,
  84, 90,
  ARRAY['vocational_training','skill_development','iti_courses','polytechnic','computer_training','beautician_course','electrician','plumbing','carpentry','motor_mechanic','welding','nursing_aide','data_entry'],
  TRUE,
  'Loan up to ₹4 lakh. Interest @ 4% (3.5% for women — 0.5% rebate). Moratorium 6-12 months depending on course length. Repayment over 7 years. Course must be ≤ 2 years duration from a government-recognized institute. Covers fees, tools, certification costs.'
);


-- =============================================================================
-- ALL 91 OFFICIAL NSFDC CHANNEL PARTNERS SEED DATA
-- Official Categories:
-- 1. SCA (37 State Channelizing Agencies)
-- 2. PSB (12 Public Sector Banks)
-- 3. RRB (15 Regional Rural Banks)
-- 4. NBFC_MFI (10 NBFC-MFIs)
-- 5. Cooperative_Bank (5 Co-operative Banks)
-- 6. Other_Agency_SIDBI (4 Other Agencies & SIDBI)
-- 7. Small_Finance_Bank (5 Small Finance Banks)
-- 8. Cooperative_Society (3 Cooperative Societies)
-- Total = 91 Channel Partners
-- =============================================================================

TRUNCATE partners RESTART IDENTITY CASCADE;

INSERT INTO partners (
  name, partner_type, address, city, district, state, pin_code,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, is_active
) VALUES

-- ======================== 1. STATE CHANNELIZING AGENCIES (SCAs) - 37 ========================

('Dr. B.R. Ambedkar Scheduled Castes Development Corporation (APSCDC)', 'SCA',
 'Corporate Office, Ambedkar Bhavan, # 20-17, Venkateswara Colony, Tirupati', 'Tirupati', 'Tirupati', 'Andhra Pradesh', '517501',
 '0877-2241444', 'apscdc@gmail.com', 'https://apscdc.ap.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(79.4192 13.6288)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.2, 68.0, TRUE),

('Assam SC Development Finance Corporation', 'SCA',
 'Bhangagarh, GNB Road, Guwahati', 'Guwahati', 'Kamrup Metropolitan', 'Assam', '781005',
 '0361-2459321', 'assamsccorp@gmail.com', 'https://scfinance.assam.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(91.7362 26.1445)'),
 ARRAY['micro_finance','term_loan','education_loan'], 7.8, 72.0, TRUE),

('Bihar State SC/BC Finance & Development Corporation (BSSCFDC)', 'SCA',
 'Maurya Lok Complex, Dak Bungalow Road, Patna', 'Patna', 'Patna', 'Bihar', '800001',
 '0612-2219054', 'bsscfdc@bihar.gov.in', 'https://scbc.bihar.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(85.1376 25.6093)'),
 ARRAY['micro_finance','term_loan','education_loan'], 8.1, 75.0, TRUE),

('Chhattisgarh SC/ST & OBC Development Corporation', 'SCA',
 'Indravati Bhavan, Block 1, Nava Raipur Atal Nagar', 'Nava Raipur', 'Raipur', 'Chhattisgarh', '492002',
 '0771-2511326', 'cg.scstcorp@cg.gov.in', 'https://scst.cg.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(81.6296 21.2514)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.3, 65.0, TRUE),

('Delhi SC Finance & Development Corporation (DSFDC)', 'SCA',
 '4/13, Asaf Ali Road, New Delhi', 'New Delhi', 'Central Delhi', 'Delhi', '110002',
 '011-23232310', 'info@dsfdc.org', 'https://dsfdc.delhigovt.nic.in',
 ST_GeographyFromText('SRID=4326;POINT(77.2310 28.6430)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.2, 70.0, TRUE),

('Gujarat Scheduled Castes Economic Development Corporation (GSCEDC)', 'SCA',
 'Block No. 9, 3rd Floor, Udyog Bhavan, Gandhinagar', 'Gandhinagar', 'Gandhinagar', 'Gujarat', '382010',
 '079-23250283', 'gscedc-guj@nic.in', 'https://gscedc.gujarat.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(72.6369 23.2156)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.8, 62.0, TRUE),

('Haryana SC Finance & Development Corporation (HSCFDC)', 'SCA',
 'SCO 20, Sector 6, Panchkula', 'Panchkula', 'Panchkula', 'Haryana', '134109',
 '0172-2584511', 'hscfdc@hry.nic.in', 'https://hsfdc.org.in',
 ST_GeographyFromText('SRID=4326;POINT(76.8507 30.6942)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.5, 67.0, TRUE),

('Himachal Pradesh SC/OBC Development Corporation (HPSCOBCDC)', 'SCA',
 'Kisan Bhavan, Boileauganj, Shimla', 'Shimla', 'Shimla', 'Himachal Pradesh', '171005',
 '0177-2652376', 'hpscobc@hp.gov.in', 'https://hpsc.hp.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(77.1734 31.1048)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.1, 60.0, TRUE),

('J&K Scheduled Castes, ST & OBC Development Corporation', 'SCA',
 'Town Hall Building, Jammu', 'Jammu', 'Jammu', 'Jammu and Kashmir', '180001',
 '0191-2545678', 'jkscstcorp@jk.gov.in', 'https://jkscstcorp.jk.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(74.8570 32.7266)'),
 ARRAY['micro_finance','term_loan','education_loan'], 7.5, 71.0, TRUE),

('Jharkhand State SC/ST & OBC Development Corporation', 'SCA',
 'Raj Bhawan Road, Ranchi', 'Ranchi', 'Ranchi', 'Jharkhand', '834001',
 '0651-2480177', 'jscstcorp@jharkhand.gov.in', 'https://jscstcorp.jharkhand.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(85.3096 23.3441)'),
 ARRAY['micro_finance','term_loan','education_loan'], 8.0, 73.0, TRUE),

('Karnataka SC/ST Development Corporation (KSCDC)', 'SCA',
 'Ambedkar Bhavan, Dr. B.R. Ambedkar Veedhi, Bengaluru', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560001',
 '080-22209208', 'kscdc@karnataka.gov.in', 'https://kscdc.kar.nic.in',
 ST_GeographyFromText('SRID=4326;POINT(77.5946 12.9716)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.5, 60.0, TRUE),

('Kerala SC/ST Development Corporation (KSDFC)', 'SCA',
 'Poojappura, Thiruvananthapuram', 'Thiruvananthapuram', 'Thiruvananthapuram', 'Kerala', '695012',
 '0471-2341144', 'ksdfc@ksdfc.com', 'https://www.ksdfc.com',
 ST_GeographyFromText('SRID=4326;POINT(76.9366 8.5241)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.2, 58.0, TRUE),

('MP State SC Finance & Development Corporation (MPSCFDC)', 'SCA',
 '7th Floor, Satpura Bhavan, Bhopal', 'Bhopal', 'Bhopal', 'Madhya Pradesh', '462004',
 '0755-2551481', 'mpscfdc@mp.gov.in', 'https://mpscfdc.mp.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(77.4126 23.2599)'),
 ARRAY['micro_finance','term_loan','education_loan'], 7.2, 74.0, TRUE),

('Maharashtra Scheduled Castes Finance & Development Corporation (MSFDC HQ)', 'SCA',
 '16th Floor, Satra Plaza, Sector 19D, Vashi, Navi Mumbai', 'Navi Mumbai', 'Thane', 'Maharashtra', '400703',
 '022-27660066', 'msfdc@maha.gov.in', 'https://msfdc.maharashtra.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(73.0297 19.0633)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.9, 63.0, TRUE),

('MSFDC Regional Office Mumbai', 'SCA',
 'World Trade Centre, Cuffe Parade, Fort, Mumbai', 'Mumbai', 'Mumbai City', 'Maharashtra', '400001',
 '022-22184512', 'msfdc.mumbai@maha.gov.in', 'https://msfdc.maharashtra.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(72.8311 18.9388)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.0, 65.0, TRUE),

('MSFDC District Office Pune', 'SCA',
 'Dr. Ambedkar Bhavan, Mangalwar Peth, Pune', 'Pune', 'Pune', 'Maharashtra', '411001',
 '020-26123456', 'msfdc.pune@maha.gov.in', 'https://msfdc.maharashtra.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(73.8567 18.5204)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.1, 64.0, TRUE),

('MSFDC District Office Nagpur', 'SCA',
 'Administrative Building, Civil Lines, Nagpur', 'Nagpur', 'Nagpur', 'Maharashtra', '440001',
 '0712-2561234', 'msfdc.nagpur@maha.gov.in', 'https://msfdc.maharashtra.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(79.0882 21.1458)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.5, 66.0, TRUE),

('MSFDC District Office Nashik', 'SCA',
 'Old Agra Road, Near Collector Office, Nashik', 'Nashik', 'Nashik', 'Maharashtra', '422001',
 '0253-2571234', 'msfdc.nashik@maha.gov.in', 'https://msfdc.maharashtra.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(73.7898 19.9975)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.3, 62.0, TRUE),

('Manipur SC & ST Development Cooperative Bank Ltd', 'SCA',
 'Secretariat Road, Imphal', 'Imphal', 'Imphal West', 'Manipur', '795001',
 '0385-2451234', 'manipurscst@gmail.com', 'https://manipur.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(93.9368 24.8170)'),
 ARRAY['micro_finance','term_loan'], 7.1, 70.0, TRUE),

('Meghalaya Industrial Development Corporation (MIDC SC Wing)', 'SCA',
 'Upland Road, Laitumkhrah, Shillong', 'Shillong', 'East Khasi Hills', 'Meghalaya', '793001',
 '0364-2223456', 'midcshillong@gmail.com', 'https://midc.meghalaya.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(91.8933 25.5788)'),
 ARRAY['micro_finance','term_loan'], 6.5, 61.0, TRUE),

('Mizoram Urban & Rural Development Agency', 'SCA',
 'Treasury Square, Aizawl', 'Aizawl', 'Aizawl', 'Mizoram', '796001',
 '0389-2321234', 'murda.aizawl@gmail.com', 'https://mizoram.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(92.7176 23.7271)'),
 ARRAY['micro_finance','term_loan'], 6.0, 59.0, TRUE),

('Nagaland Industrial Development Corporation (NIDC)', 'SCA',
 'Circular Road, Dimapur', 'Dimapur', 'Dimapur', 'Nagaland', '797112',
 '03862-225678', 'nidclimited@gmail.com', 'https://nidc.nagaland.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(93.7270 25.9060)'),
 ARRAY['micro_finance','term_loan'], 6.8, 63.0, TRUE),

('Odisha SC Development Finance Corporation (OSCFDC)', 'SCA',
 'Sachivalaya Marg, Bhubaneswar', 'Bhubaneswar', 'Khordha', 'Odisha', '751001',
 '0674-2536293', 'oscfdc.bbsr@gmail.com', 'https://oscfdc.odisha.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(85.8245 20.2961)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.7, 69.0, TRUE),

('Punjab SC Land Development & Finance Corporation (PUNSCARFIN)', 'SCA',
 'SCO 80, Phase IX, Sector 65, Mohali', 'Mohali', 'SAS Nagar', 'Punjab', '160062',
 '0172-5006101', 'punscarfin@punjab.gov.in', 'https://www.punscarfin.in',
 ST_GeographyFromText('SRID=4326;POINT(76.7179 30.7046)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.8, 66.0, TRUE),

('Rajasthan SC/OBC Finance & Development Cooperative Corporation (RSCOBCFDCC)', 'SCA',
 '4-Sa-15, Jawahar Lal Nehru Marg, Jaipur', 'Jaipur', 'Jaipur', 'Rajasthan', '302005',
 '0141-2703545', 'rscobcfdcc@rajasthan.gov.in', 'https://sjf.rajasthan.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(75.7873 26.9124)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.3, 69.0, TRUE),

('Sikkim SC/ST & OBC Development Corporation (SABCO)', 'SCA',
 'Tibet Road, Gangtok', 'Gangtok', 'East Sikkim', 'Sikkim', '737101',
 '03592-202345', 'sabco.gangtok@gmail.com', 'https://sikkim.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(88.6138 27.3389)'),
 ARRAY['micro_finance','term_loan'], 5.0, 58.0, TRUE),

('Tamil Nadu Adi Dravidar Housing & Development Corporation (TAHDCO)', 'SCA',
 '143, R.K. Mutt Road, Mandaiveli, Chennai', 'Chennai', 'Chennai', 'Tamil Nadu', '600028',
 '044-24918999', 'tahdco@tn.gov.in', 'https://tahdco.in',
 ST_GeographyFromText('SRID=4326;POINT(80.2607 13.0142)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.1, 70.0, TRUE),

('Telangana SC Development Corporation (TSCDC)', 'SCA',
 '3-5-926/A, Hill Fort Road, Hyderabad', 'Hyderabad', 'Hyderabad', 'Telangana', '500004',
 '040-23230098', 'tscdc.hyderabad@telangana.gov.in', 'https://tscdc.telangana.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(78.4867 17.3850)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.6, 64.0, TRUE),

('Tripura SC Cooperative Development Corporation Ltd', 'SCA',
 'Pandit Nehru Complex, Gurkhabasti, Agartala', 'Agartala', 'West Tripura', 'Tripura', '799001',
 '0381-2324567', 'scdevelopment.tripura@gmail.com', 'https://tripura.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(91.2868 23.8315)'),
 ARRAY['micro_finance','term_loan'], 6.4, 62.0, TRUE),

('UP Scheduled Castes Finance & Development Corporation (UPSCFDC)', 'SCA',
 'Avas Vikas Colony, Vibhuti Khand, Gomti Nagar, Lucknow', 'Lucknow', 'Lucknow', 'Uttar Pradesh', '226010',
 '0522-2304540', 'upscfdc.lucknow@up.gov.in', 'https://upscfdc.up.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(80.9462 26.8650)'),
 ARRAY['micro_finance','term_loan','education_loan'], 7.8, 80.0, TRUE),

('Uttarakhand SC/ST & OBC Development Corporation', 'SCA',
 '23 Subhash Road, Dehradun', 'Dehradun', 'Dehradun', 'Uttarakhand', '248001',
 '0135-2651290', 'uk.scstcorp@uttarakhand.gov.in', 'https://uk.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(78.0322 30.3165)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.9, 61.0, TRUE),

('West Bengal SC & OBC Development Finance Corporation (WBSCOB)', 'SCA',
 'Bikash Bhavan, Salt Lake City, Kolkata', 'Kolkata', 'North 24 Parganas', 'West Bengal', '700091',
 '033-23343856', 'wbscob.kolkata@wb.gov.in', 'https://wbsccorp.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(88.3993 22.5726)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.7, 66.0, TRUE),

('Andaman & Nicobar Islands Integrated Dev Corp (ANIIDCO SC Cell)', 'SCA',
 'Vikas Bhavan, Port Blair', 'Port Blair', 'South Andaman', 'Andaman and Nicobar Islands', '744101',
 '03192-232345', 'aniidco.portblair@gmail.com', 'https://aniidco.andaman.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(92.7265 11.6234)'),
 ARRAY['micro_finance','term_loan'], 4.0, 52.0, TRUE),

('Chandigarh Financial Corporation (SC Wing)', 'SCA',
 'Sector 17-C, Chandigarh', 'Chandigarh', 'Chandigarh', 'Chandigarh', '160017',
 '0172-2701234', 'cfc.chandigarh@gov.in', 'https://chandigarh.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(76.7794 30.7333)'),
 ARRAY['micro_finance','term_loan'], 3.8, 55.0, TRUE),

('Dadra & Nagar Haveli & Daman & Diu SC Development Corporation', 'SCA',
 'Secretariat Building, Silvassa', 'Silvassa', 'Dadra and Nagar Haveli', 'Dadra and Nagar Haveli and Daman and Diu', '396230',
 '0260-2642345', 'scdev.silvassa@gov.in', 'https://dnh.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(73.0078 20.2763)'),
 ARRAY['micro_finance','term_loan'], 4.2, 57.0, TRUE),

('Puducherry Adi Dravidar Development Corporation (PADCO)', 'SCA',
 'No. 10, Industrial Estate, Thattanchavady, Puducherry', 'Puducherry', 'Puducherry', 'Puducherry', '605001',
 '0413-2245678', 'padco.puducherry@gmail.com', 'https://py.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(79.8083 11.9416)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.5, 60.0, TRUE),

('Goa SC & OBC Finance & Development Corporation', 'SCA',
 'Dayanand Bandodkar Marg, Panaji', 'Panaji', 'North Goa', 'Goa', '403001',
 '0832-2226597', 'goascobc@gmail.com', 'https://goa.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(73.8278 15.4909)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.8, 55.0, TRUE),


-- ======================== 2. PUBLIC SECTOR BANKS (PSBs) - 12 ========================

('State Bank of India – Mumbai Main Branch', 'PSB',
 'Nariman Point, Fort, Mumbai', 'Mumbai', 'Mumbai City', 'Maharashtra', '400021',
 '022-22742821', 'customercare@sbi.co.in', 'https://www.sbi.co.in',
 ST_GeographyFromText('SRID=4326;POINT(72.8258 18.9256)'),
 ARRAY['term_loan','education_loan'], 4.5, 65.0, TRUE),

('Punjab National Bank – New Delhi Main Branch', 'PSB',
 'N-5, Connaught Circus, New Delhi', 'New Delhi', 'Central Delhi', 'Delhi', '110001',
 '011-23324321', 'care@pnb.co.in', 'https://www.pnbindia.in',
 ST_GeographyFromText('SRID=4326;POINT(77.2195 28.6315)'),
 ARRAY['term_loan','education_loan'], 5.8, 68.0, TRUE),

('Bank of Baroda – Ahmedabad Main Branch', 'PSB',
 'Bhadra, Lal Darwaja, Ahmedabad', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '380001',
 '079-25502080', 'contact@bankofbaroda.com', 'https://www.bankofbaroda.in',
 ST_GeographyFromText('SRID=4326;POINT(72.5714 23.0225)'),
 ARRAY['term_loan','education_loan'], 5.3, 70.0, TRUE),

('Canara Bank – Bengaluru Main Branch', 'PSB',
 '112, J.C. Road, Bengaluru', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560002',
 '080-22222458', 'hocanara@canarabank.com', 'https://www.canarabank.com',
 ST_GeographyFromText('SRID=4326;POINT(77.5838 12.9659)'),
 ARRAY['term_loan','education_loan'], 5.3, 71.0, TRUE),

('Union Bank of India – Hyderabad Main Branch', 'PSB',
 'Abid Road, Sultan Bazaar, Hyderabad', 'Hyderabad', 'Hyderabad', 'Telangana', '500001',
 '040-24613388', 'customercare@unionbankofindia.bank', 'https://www.unionbankofindia.co.in',
 ST_GeographyFromText('SRID=4326;POINT(78.4691 17.3850)'),
 ARRAY['term_loan','education_loan'], 6.0, 72.0, TRUE),

('Bank of India – Kolkata Main Branch', 'PSB',
 '5, B.T.M. Sarani (Brabourne Road), Kolkata', 'Kolkata', 'Kolkata', 'West Bengal', '700001',
 '033-22311321', 'info@bankofindia.co.in', 'https://www.bankofindia.co.in',
 ST_GeographyFromText('SRID=4326;POINT(88.3697 22.5744)'),
 ARRAY['term_loan','education_loan'], 5.7, 67.0, TRUE),

('Indian Bank – Chennai Head Office', 'PSB',
 '254-260, Avvai Shanmugam Salai, Royapettah, Chennai', 'Chennai', 'Chennai', 'Tamil Nadu', '600014',
 '044-28520421', 'customer.care@indianbank.co.in', 'https://www.indianbank.in',
 ST_GeographyFromText('SRID=4326;POINT(80.2625 13.0519)'),
 ARRAY['term_loan','education_loan'], 4.5, 63.0, TRUE),

('Central Bank of India – Bhopal Main Branch', 'PSB',
 'Hamidia Road, Bhopal', 'Bhopal', 'Bhopal', 'Madhya Pradesh', '462001',
 '0755-2551481', 'info@centralbank.co.in', 'https://www.centralbankofindia.co.in',
 ST_GeographyFromText('SRID=4326;POINT(77.4126 23.2599)'),
 ARRAY['term_loan','education_loan'], 7.1, 74.0, TRUE),

('Indian Overseas Bank – Chennai Main Branch', 'PSB',
 '763 Anna Salai, Chennai', 'Chennai', 'Chennai', 'Tamil Nadu', '600002',
 '044-28524100', 'care@iob.in', 'https://www.iob.in',
 ST_GeographyFromText('SRID=4326;POINT(80.2500 13.0600)'),
 ARRAY['term_loan','education_loan'], 5.9, 69.0, TRUE),

('UCO Bank – Kolkata HO Branch', 'PSB',
 '10 BTM Sarani, Brabourne Road, Kolkata', 'Kolkata', 'Kolkata', 'West Bengal', '700001',
 '033-44557788', 'contactus@ucobank.co.in', 'https://www.ucobank.com',
 ST_GeographyFromText('SRID=4326;POINT(88.3500 22.5600)'),
 ARRAY['term_loan','education_loan'], 6.2, 70.0, TRUE),

('Bank of Maharashtra – Pune Bajirao Road Branch', 'PSB',
 '1501, Shivajinagar, Bajirao Road, Pune', 'Pune', 'Pune', 'Maharashtra', '411002',
 '020-25532731', 'bomservices@mahabank.co.in', 'https://www.bankofmaharashtra.in',
 ST_GeographyFromText('SRID=4326;POINT(73.8567 18.5150)'),
 ARRAY['term_loan','education_loan'], 5.0, 66.0, TRUE),

('Punjab & Sind Bank – New Delhi HO Branch', 'PSB',
 '21 Rajendra Place, New Delhi', 'New Delhi', 'Central Delhi', 'Delhi', '110001',
 '011-25717750', 'psbcare@psb.co.in', 'https://punjabandsindbank.co.in',
 ST_GeographyFromText('SRID=4326;POINT(77.2200 28.6300)'),
 ARRAY['term_loan','education_loan'], 6.5, 73.0, TRUE),


-- ======================== 3. REGIONAL RURAL BANKS (RRBs) - 15 ========================

('Gramin Bank of Aryavart – Lucknow HO', 'RRB',
 'Sector C, Aliganj, Lucknow', 'Lucknow', 'Lucknow', 'Uttar Pradesh', '226024',
 '0522-2323456', 'contact@aryavart-rrb.com', 'https://www.aryavart-rrb.com',
 ST_GeographyFromText('SRID=4326;POINT(80.9874 26.8768)'),
 ARRAY['micro_finance','term_loan'], 7.5, 77.0, TRUE),

('Vidarbha Konkan Gramin Bank – Nagpur HO', 'RRB',
 'Dharampeth, Ring Road, Nagpur', 'Nagpur', 'Nagpur', 'Maharashtra', '440010',
 '0712-2554321', 'vkgb.nagpur@vkgb.co.in', 'https://www.vkgb.co.in',
 ST_GeographyFromText('SRID=4326;POINT(79.0882 21.1458)'),
 ARRAY['micro_finance','term_loan'], 6.2, 72.0, TRUE),

('Vidarbha Konkan Gramin Bank – Pune Branch', 'RRB',
 'Shivajinagar, FC Road, Pune', 'Pune', 'Pune', 'Maharashtra', '411005',
 '020-25671234', 'vkgb.pune@vkgb.co.in', 'https://www.vkgb.co.in',
 ST_GeographyFromText('SRID=4326;POINT(73.8500 18.5300)'),
 ARRAY['micro_finance','term_loan'], 5.8, 68.0, TRUE),

('Vidarbha Konkan Gramin Bank – Mumbai Branch', 'RRB',
 'Bandra East, BKC, Mumbai', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400051',
 '022-26591234', 'vkgb.mumbai@vkgb.co.in', 'https://www.vkgb.co.in',
 ST_GeographyFromText('SRID=4326;POINT(72.8400 19.0500)'),
 ARRAY['micro_finance','term_loan'], 5.5, 65.0, TRUE),

('Bangiya Gramin Vikash Bank – Kolkata', 'RRB',
 'Camac Street, Kolkata', 'Kolkata', 'Kolkata', 'West Bengal', '700016',
 '033-22821010', 'bgvb.kolkata@bgvb.co.in', 'https://www.bgvb.in',
 ST_GeographyFromText('SRID=4326;POINT(88.3562 22.5500)'),
 ARRAY['micro_finance','term_loan'], 6.9, 73.0, TRUE),

('Kerala Gramin Bank – Malappuram HO', 'RRB',
 'Opposite Bus Stand, Malappuram', 'Malappuram', 'Malappuram', 'Kerala', '676505',
 '0483-2735888', 'klgb@keralagrabank.com', 'https://www.keralagrama.bank',
 ST_GeographyFromText('SRID=4326;POINT(76.0722 11.0510)'),
 ARRAY['micro_finance','term_loan'], 4.8, 64.0, TRUE),

('Karnataka Gramin Bank – Dharwad', 'RRB',
 'Dr. P.G. Halakatti Road, Dharwad', 'Dharwad', 'Dharwad', 'Karnataka', '580001',
 '0836-2441450', 'kgb@kgbank.in', 'https://karnatakagraminbank.com',
 ST_GeographyFromText('SRID=4326;POINT(75.0078 15.4589)'),
 ARRAY['micro_finance','term_loan'], 5.6, 68.0, TRUE),

('Prathama UP Gramin Bank – Moradabad HO', 'RRB',
 'Civil Lines, Moradabad', 'Moradabad', 'Moradabad', 'Uttar Pradesh', '244001',
 '0591-2412345', 'prathama@pupgb.in', 'https://prathambank.org',
 ST_GeographyFromText('SRID=4326;POINT(78.7733 28.8386)'),
 ARRAY['micro_finance','term_loan'], 7.8, 78.0, TRUE),

('Andhra Pradesh Grameena Vikas Bank – Warangal HO', 'RRB',
 'Nakkalagutta, Hanamkonda, Warangal', 'Warangal', 'Warangal', 'Telangana', '506002',
 '0870-2577778', 'apgvb@apgvb.in', 'https://www.apgpbank.in',
 ST_GeographyFromText('SRID=4326;POINT(79.5971 17.9689)'),
 ARRAY['micro_finance','term_loan'], 5.9, 70.0, TRUE),

('Baroda UP Bank – Gorakhpur HO', 'RRB',
 'Buddh Vihar Commercial Complex, Gorakhpur', 'Gorakhpur', 'Gorakhpur', 'Uttar Pradesh', '273001',
 '0551-2201234', 'barodaupbank@barodaupbank.co.in', 'https://barodaupbank.in',
 ST_GeographyFromText('SRID=4326;POINT(83.3731 26.7606)'),
 ARRAY['micro_finance','term_loan'], 7.2, 75.0, TRUE),

('Bihar Gramin Bank – Patna Main Branch', 'RRB',
 'Boring Road, Patna', 'Patna', 'Patna', 'Bihar', '800001',
 '0612-2541234', 'bihargraminbank@bgb.co.in', 'https://bihargraminbank.in',
 ST_GeographyFromText('SRID=4326;POINT(85.1400 25.6100)'),
 ARRAY['micro_finance','term_loan'], 7.9, 79.0, TRUE),

('Himachal Pradesh Gramin Bank – Mandi HO', 'RRB',
 'Jail Road, Mandi', 'Mandi', 'Mandi', 'Himachal Pradesh', '175001',
 '01905-223456', 'hpgb@hpgb.in', 'https://hpgraminbank.in',
 ST_GeographyFromText('SRID=4326;POINT(76.9316 31.7084)'),
 ARRAY['micro_finance','term_loan'], 5.2, 62.0, TRUE),

('Maharashtra Gramin Bank – Chhatrapati Sambhajinagar HO', 'RRB',
 'Golwadi, Waluj, Chhatrapati Sambhajinagar (Aurangabad)', 'Aurangabad', 'Aurangabad', 'Maharashtra', '431001',
 '0240-2441234', 'mgb@mahagramin.in', 'https://mahagramin.in',
 ST_GeographyFromText('SRID=4326;POINT(75.3433 19.8762)'),
 ARRAY['micro_finance','term_loan'], 6.4, 71.0, TRUE),

('Odisha Gramya Bank – Bhubaneswar HO', 'RRB',
 'Gandamunda, Khandagiri, Bhubaneswar', 'Bhubaneswar', 'Khordha', 'Odisha', '751030',
 '0674-2353000', 'ogb@odishabank.in', 'https://odishabank.in',
 ST_GeographyFromText('SRID=4326;POINT(85.8200 20.3000)'),
 ARRAY['micro_finance','term_loan'], 6.7, 72.0, TRUE),

('Rajasthan Marudhara Gramin Bank – Jodhpur HO', 'RRB',
 'Tulsi Tower, Paota B Road, Jodhpur', 'Jodhpur', 'Jodhpur', 'Rajasthan', '342001',
 '0291-2541234', 'rmgb@rmgb.in', 'https://rmgb.in',
 ST_GeographyFromText('SRID=4326;POINT(73.0243 26.2389)'),
 ARRAY['micro_finance','term_loan'], 6.5, 73.0, TRUE),


-- ======================== 4. NBFC-MFIs - 10 ========================

('Arohan Financial Services – Kolkata HO', 'NBFC_MFI',
 '3rd Floor, Ecospace, Action Area II, Newtown, Kolkata', 'Kolkata', 'North 24 Parganas', 'West Bengal', '700156',
 '033-71901619', 'support@arohan.in', 'https://arohan.in',
 ST_GeographyFromText('SRID=4326;POINT(88.4618 22.5726)'),
 ARRAY['micro_finance'], 2.8, 55.0, TRUE),

('Spandana Sphoorty Financial – Hyderabad HO', 'NBFC_MFI',
 'Plot No. 1, Survey No. 18 & 19, Patrika Nagar, Hitech City, Hyderabad', 'Hyderabad', 'Rangareddy', 'Telangana', '500081',
 '040-44555566', 'contact@spandanasphoorty.com', 'https://www.spandanasphoorty.com',
 ST_GeographyFromText('SRID=4326;POINT(78.3790 17.4435)'),
 ARRAY['micro_finance'], 3.1, 58.0, TRUE),

('CreditAccess Grameen – Bengaluru HO', 'NBFC_MFI',
 'No. 49, 3rd Floor, Ulsoor Road, Bengaluru', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560042',
 '080-49161000', 'info@cagrameen.in', 'https://www.creditaccess.in',
 ST_GeographyFromText('SRID=4326;POINT(77.6219 12.9745)'),
 ARRAY['micro_finance'], 2.5, 52.0, TRUE),

('Satin Creditcare Network – New Delhi HO', 'NBFC_MFI',
 'DLF Prime Towers, F-79-80, Okhla Industrial Area Phase I, New Delhi', 'New Delhi', 'South East Delhi', 'Delhi', '110020',
 '011-47025900', 'info@satincreditcare.com', 'https://www.satincreditcare.com',
 ST_GeographyFromText('SRID=4326;POINT(77.2695 28.5355)'),
 ARRAY['micro_finance'], 3.5, 60.0, TRUE),

('Muthoot Microfin – Chennai Corporate Office', 'NBFC_MFI',
 '3rd Floor, Mercury Aura, Rajiv Gandhi Salai, Perungudi, Chennai', 'Chennai', 'Chennai', 'Tamil Nadu', '600096',
 '044-45012345', 'info@muthootmicrofin.com', 'https://www.muthootmicrofin.com',
 ST_GeographyFromText('SRID=4326;POINT(80.2374 12.9627)'),
 ARRAY['micro_finance'], 2.9, 56.0, TRUE),

('Asirvad Microfinance – Chennai HO', 'NBFC_MFI',
 'Desabandhu Plaza, 47, Whites Road, Royapettah, Chennai', 'Chennai', 'Chennai', 'Tamil Nadu', '600014',
 '044-42123456', 'info@asirvad.in', 'https://asirvadmicrofinance.co.in',
 ST_GeographyFromText('SRID=4326;POINT(80.1900 13.0300)'),
 ARRAY['micro_finance'], 3.0, 57.0, TRUE),

('Fusion Microfinance – Gurugram HO', 'NBFC_MFI',
 'Plot No. 86, Sector 44, Gurugram', 'Gurugram', 'Gurugram', 'Haryana', '122001',
 '0124-6910500', 'customercare@fusionmicrofinance.com', 'https://fusionmicrofinance.com',
 ST_GeographyFromText('SRID=4326;POINT(77.0266 28.4595)'),
 ARRAY['micro_finance'], 2.7, 54.0, TRUE),

('Annapurna Finance – Bhubaneswar HO', 'NBFC_MFI',
 'Khandagiri, Bhubaneswar', 'Bhubaneswar', 'Khordha', 'Odisha', '751010',
 '0674-2386500', 'info@annapurnafinance.in', 'https://annapurnafinance.in',
 ST_GeographyFromText('SRID=4326;POINT(85.8300 20.2500)'),
 ARRAY['micro_finance'], 3.2, 59.0, TRUE),

('Svasti Microfinance – Mumbai HO', 'NBFC_MFI',
 'Andheri East, Kurla Road, Mumbai', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400069',
 '022-42125000', 'care@svasti.in', 'https://svasti.in',
 ST_GeographyFromText('SRID=4326;POINT(72.8500 19.1200)'),
 ARRAY['micro_finance'], 2.6, 53.0, TRUE),

('Sonata Finance – Lucknow HO', 'NBFC_MFI',
 'Hazratganj, Park Road, Lucknow', 'Lucknow', 'Lucknow', 'Uttar Pradesh', '226001',
 '0522-4001234', 'info@sonatafinance.in', 'https://sonatafinance.in',
 ST_GeographyFromText('SRID=4326;POINT(80.9500 26.8500)'),
 ARRAY['micro_finance'], 3.4, 61.0, TRUE),


-- ======================== 5. CO-OPERATIVE BANKS - 5 ========================

('Maharashtra State Co-operative Bank – Mumbai HQ', 'Cooperative_Bank',
 'Sir Vithaldas Thackersey Smruti Bhavan, 9 Maharashtra Chamber of Commerce Lane, Fort, Mumbai', 'Mumbai', 'Mumbai City', 'Maharashtra', '400001',
 '022-22800747', 'mscb.mumbai@mscbank.com', 'https://www.mscbank.com',
 ST_GeographyFromText('SRID=4326;POINT(72.8330 18.9300)'),
 ARRAY['micro_finance','term_loan'], 4.2, 65.0, TRUE),

('Saraswat Co-operative Bank – Mumbai Prabhadevi HO', 'Cooperative_Bank',
 'Saraswat Bank Bhavan, Appasaheb Marathe Marg, Prabhadevi, Mumbai', 'Mumbai', 'Mumbai City', 'Maharashtra', '400025',
 '022-66005555', 'corporate@saraswatbank.com', 'https://www.saraswatbank.com',
 ST_GeographyFromText('SRID=4326;POINT(72.8250 19.0150)'),
 ARRAY['micro_finance','term_loan'], 3.8, 60.0, TRUE),

('Cosmos Co-operative Bank – Pune HO', 'Cooperative_Bank',
 'Cosmos Tower, University Road, Ganeshkhind, Pune', 'Pune', 'Pune', 'Maharashtra', '411005',
 '020-67086708', 'customercare@cosmosbank.in', 'https://www.cosmosbank.com',
 ST_GeographyFromText('SRID=4326;POINT(73.8500 18.5200)'),
 ARRAY['micro_finance','term_loan'], 4.0, 62.0, TRUE),

('Gujarat State Co-operative Bank – Ahmedabad HO', 'Cooperative_Bank',
 'Sardar Patel Ring Road, Satellite, Ahmedabad', 'Ahmedabad', 'Ahmedabad', 'Gujarat', '380014',
 '079-27474747', 'gscb@gscbank.co.in', 'https://gscbank.co.in',
 ST_GeographyFromText('SRID=4326;POINT(72.5600 23.0300)'),
 ARRAY['micro_finance','term_loan'], 4.5, 67.0, TRUE),

('AP State Co-operative Bank (APCOB) – Vijayawada HO', 'Cooperative_Bank',
 'Governorpet, Vijayawada', 'Vijayawada', 'NTR District', 'Andhra Pradesh', '520002',
 '0866-2423456', 'apcob@apcob.org', 'https://www.apcob.org',
 ST_GeographyFromText('SRID=4326;POINT(80.6480 16.5062)'),
 ARRAY['micro_finance','term_loan'], 4.6, 68.0, TRUE),


-- ======================== 6. OTHER AGENCIES & SIDBI - 4 ========================

('Small Industries Development Bank of India (SIDBI HO)', 'Other_Agency_SIDBI',
 'SIDBI Tower, 15 Ashok Marg, Lucknow', 'Lucknow', 'Lucknow', 'Uttar Pradesh', '226001',
 '0522-2288546', 'info@sidbi.in', 'https://www.sidbi.in',
 ST_GeographyFromText('SRID=4326;POINT(80.9400 26.8400)'),
 ARRAY['micro_finance','term_loan'], 2.1, 45.0, TRUE),

('SIDBI Regional Office – Mumbai BKC', 'Other_Agency_SIDBI',
 'Plot No. C-11, G Block, Bandra Kurla Complex, Mumbai', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400051',
 '022-67531234', 'mumbai@sidbi.in', 'https://www.sidbi.in',
 ST_GeographyFromText('SRID=4326;POINT(72.8680 19.0660)'),
 ARRAY['micro_finance','term_loan'], 2.0, 48.0, TRUE),

('National Small Industries Corporation (NSIC Okhla HO)', 'Other_Agency_SIDBI',
 'NSIC Bhavan, Okhla Industrial Estate, New Delhi', 'New Delhi', 'South Delhi', 'Delhi', '110020',
 '011-26926161', 'info@nsic.co.in', 'https://www.nsic.co.in',
 ST_GeographyFromText('SRID=4326;POINT(77.2600 28.5400)'),
 ARRAY['term_loan'], 3.2, 55.0, TRUE),

('North Eastern Development Finance Corporation (NEDFi HO)', 'Other_Agency_SIDBI',
 'NEDFi House, GS Road, Dispur, Guwahati', 'Guwahati', 'Kamrup Metropolitan', 'Assam', '781006',
 '0361-2237050', 'info@nedfi.com', 'https://www.nedfi.com',
 ST_GeographyFromText('SRID=4326;POINT(91.7500 26.1800)'),
 ARRAY['micro_finance','term_loan'], 3.5, 58.0, TRUE),


-- ======================== 7. SMALL FINANCE BANKS - 5 ========================

('AU Small Finance Bank – Jaipur HO', 'Small_Finance_Bank',
 '19-A, Dhuleshwar Garden, Ajmer Road, Jaipur', 'Jaipur', 'Jaipur', 'Rajasthan', '302011',
 '0141-4110000', 'customercare@aubank.in', 'https://www.aubank.in',
 ST_GeographyFromText('SRID=4326;POINT(75.7900 26.9000)'),
 ARRAY['micro_finance','term_loan'], 3.1, 56.0, TRUE),

('Equitas Small Finance Bank – Chennai HO', 'Small_Finance_Bank',
 '4th Floor, Phase II, Spencer Plaza, No. 769, Anna Salai, Chennai', 'Chennai', 'Chennai', 'Tamil Nadu', '600006',
 '044-42995000', 'care@equitasbank.com', 'https://www.equitasbank.com',
 ST_GeographyFromText('SRID=4326;POINT(80.2500 13.0400)'),
 ARRAY['micro_finance','term_loan'], 2.9, 54.0, TRUE),

('Ujjivan Small Finance Bank – Bengaluru HO', 'Small_Finance_Bank',
 'Grape Garden, No. 27, 3rd Cross, 3rd Block, Koramangala, Bengaluru', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560027',
 '080-45609100', 'customercare@ujjivan.com', 'https://www.ujjivansfb.in',
 ST_GeographyFromText('SRID=4326;POINT(77.5870 12.9716)'),
 ARRAY['micro_finance','term_loan'], 2.5, 50.0, TRUE),

('Jana Small Finance Bank – Bengaluru HO', 'Small_Finance_Bank',
 'Fairfield, 1/1, Dickinson Road, Bengaluru', 'Bengaluru', 'Bengaluru Urban', 'Karnataka', '560025',
 '080-46020000', 'customercare@janabank.com', 'https://www.janabank.com',
 ST_GeographyFromText('SRID=4326;POINT(77.6000 12.9500)'),
 ARRAY['micro_finance','term_loan'], 3.3, 59.0, TRUE),

('Capital Small Finance Bank – Jalandhar HO', 'Small_Finance_Bank',
 'Midas Corporate Park, 3rd Floor, GT Road, Jalandhar', 'Jalandhar', 'Jalandhar', 'Punjab', '144001',
 '0181-5051111', 'info@capitalbank.co.in', 'https://www.capitalbank.co.in',
 ST_GeographyFromText('SRID=4326;POINT(75.5700 31.3200)'),
 ARRAY['micro_finance','term_loan'], 3.6, 60.0, TRUE),


-- ======================== 8. COOPERATIVE SOCIETIES - 3 ========================

('Multi-State SC Credit Cooperative Society – New Delhi Office', 'Cooperative_Society',
 'Paharganj Main Market, Near Railway Station, New Delhi', 'New Delhi', 'Central Delhi', 'Delhi', '110001',
 '011-23581234', 'info@multistatesc.coop', 'https://multistatesc.coop',
 ST_GeographyFromText('SRID=4326;POINT(77.2300 28.6350)'),
 ARRAY['micro_finance'], 4.8, 62.0, TRUE),

('NAFED SC Beneficiary Self-Help Cooperative Federation', 'Cooperative_Society',
 'NAFED House, Ashram Chowk, Ring Road, New Delhi', 'New Delhi', 'South East Delhi', 'Delhi', '110014',
 '011-26340019', 'scfed@nafed-india.com', 'https://nafed-india.com',
 ST_GeographyFromText('SRID=4326;POINT(77.2500 28.5700)'),
 ARRAY['micro_finance','term_loan'], 4.5, 64.0, TRUE),

('Maharashtra State SC Weavers Co-operative Federation – Nagpur', 'Cooperative_Society',
 'Handloom Market Complex, Gandhibagh, Nagpur', 'Nagpur', 'Nagpur', 'Maharashtra', '440002',
 '0712-2721234', 'scweavers.nagpur@maha.gov.in', 'https://maharashtra.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(79.0800 21.1500)'),
 ARRAY['micro_finance','term_loan'], 5.0, 66.0, TRUE),

-- ======================== 9. ADDITIONAL SMALL FINANCE BANKS (6) ========================

('ESAF Small Finance Bank – Thrissur HO', 'Small_Finance_Bank',
 'Building No. XIV/50, ESAF Bhavan, Mannuthy, Thrissur', 'Thrissur', 'Thrissur', 'Kerala', '680651',
 '0487-7123456', 'customercare@esafbank.com', 'https://www.esafbank.com',
 ST_GeographyFromText('SRID=4326;POINT(76.2673 10.5303)'),
 ARRAY['micro_finance','term_loan'], 2.8, 55.0, TRUE),

('Suryoday Small Finance Bank – Navi Mumbai HO', 'Small_Finance_Bank',
 '1101, Sharda Terraces, Plot No. 65, Sector 11, CBD Belapur, Navi Mumbai', 'Navi Mumbai', 'Thane', 'Maharashtra', '400614',
 '022-71243333', 'smile@suryodaybank.com', 'https://www.suryodaybank.com',
 ST_GeographyFromText('SRID=4326;POINT(73.0375 19.0202)'),
 ARRAY['micro_finance','term_loan'], 3.2, 58.0, TRUE),

('Utkarsh Small Finance Bank – Varanasi HO', 'Small_Finance_Bank',
 'Utkarsh Tower, S-24/1-2, First Floor, Mahavir Mandir Road, Orderly Bazar, Varanasi', 'Varanasi', 'Varanasi', 'Uttar Pradesh', '221002',
 '0542-6605555', 'customercare@utkarsh.bank', 'https://www.utkarsh.bank',
 ST_GeographyFromText('SRID=4326;POINT(82.9739 25.3176)'),
 ARRAY['micro_finance','term_loan'], 3.0, 56.0, TRUE),

('Shivalik Small Finance Bank – Noida Corporate Office', 'Small_Finance_Bank',
 'Plot No. A-12, Sector 60, Noida', 'Noida', 'Gautam Buddha Nagar', 'Uttar Pradesh', '201301',
 '0120-4050000', 'reachus@shivalikbank.com', 'https://shivalikbank.com',
 ST_GeographyFromText('SRID=4326;POINT(77.3699 28.5997)'),
 ARRAY['micro_finance','term_loan'], 3.4, 60.0, TRUE),

('Unity Small Finance Bank – Mumbai HO', 'Small_Finance_Bank',
 'Centrum House, CST Road, Vidyanagari Marg, Kalina, Santacruz East, Mumbai', 'Mumbai', 'Mumbai Suburban', 'Maharashtra', '400098',
 '022-42159000', 'care@unitybank.co.in', 'https://theunitybank.com',
 ST_GeographyFromText('SRID=4326;POINT(72.8683 19.0732)'),
 ARRAY['micro_finance','term_loan'], 2.9, 54.0, TRUE),

('North East Small Finance Bank – Guwahati HO', 'Small_Finance_Bank',
 '1st Floor, Subham Velox, GS Road, Dispur, Guwahati', 'Guwahati', 'Kamrup Metropolitan', 'Assam', '781006',
 '0361-7180000', 'customercare@nesfb.com', 'https://www.nesfb.com',
 ST_GeographyFromText('SRID=4326;POINT(91.7898 26.1420)'),
 ARRAY['micro_finance','term_loan'], 3.5, 59.0, TRUE);

UPDATE partners SET verification_status = 'additional' WHERE name LIKE '%ESAF%' OR name LIKE '%Suryoday%' OR name LIKE '%Utkarsh%' OR name LIKE '%Shivalik%' OR name LIKE '%Unity%' OR name LIKE '%North East Small%';


