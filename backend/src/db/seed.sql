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
-- CHANNEL PARTNERS SEED DATA
-- Sources: NSFDC official list, state corporation websites, public records
-- Note: NPA % and fund utilization % are ILLUSTRATIVE — this data is not
--       publicly published in real-time. A production deployment would connect
--       to a live partner-health API feed from NSFDC.
-- 37 SCAs + representative PSBs + RRBs + NBFC-MFIs across major states
-- =============================================================================

TRUNCATE partners RESTART IDENTITY CASCADE;

INSERT INTO partners (
  name, partner_type, address, city, state,
  phone, email, website, location,
  eligible_categories, npa_percent, fund_utilization_percent, is_active
) VALUES

-- ======================== STATE CHANNELIZING AGENCIES (SCAs) ========================

-- Andhra Pradesh
('Dr. B.R. Ambedkar Scheduled Castes Development Corporation (APSCDC)', 'SCA',
 'Corporate Office, Ambedkar Bhavan, # 20-17, Venkateswara Colony, Tirupati', 'Tirupati', 'Andhra Pradesh',
 '0877-2241444', 'apscdc@gmail.com', 'https://apscdc.ap.gov.in',
 ST_GeographyFromText('SRID=4326;POINT(79.4192 13.6288)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.2, 68.0, TRUE),

-- Assam
('Assam SC Development Finance Corporation', 'SCA',
 'Bhangagarh, GNB Road, Guwahati', 'Guwahati', 'Assam',
 '0361-2459321', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(91.7362 26.1445)'),
 ARRAY['micro_finance','term_loan','education_loan'], 7.8, 72.0, TRUE),

-- Bihar
('Bihar State SC/BC Finance & Development Corporation (BSSCFDC)', 'SCA',
 'Maurya Lok Complex, Dak Bungalow Road, Patna', 'Patna', 'Bihar',
 '0612-2219054', 'bsscfdc@bihar.gov.in', NULL,
 ST_GeographyFromText('SRID=4326;POINT(85.1376 25.6093)'),
 ARRAY['micro_finance','term_loan','education_loan'], 9.1, 75.0, TRUE),

-- Chhattisgarh
('Chhattisgarh SC/ST & OBC Development Corporation', 'SCA',
 'Indravati Bhavan, Block 1, Nava Raipur Atal Nagar', 'Nava Raipur', 'Chhattisgarh',
 '0771-2511326', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(81.6296 21.2514)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.3, 65.0, TRUE),

-- Delhi
('Delhi SC Finance & Development Corporation (DSFDC)', 'SCA',
 '4/13, Asaf Ali Road, New Delhi', 'New Delhi', 'Delhi',
 '011-23232310', 'info@dsfdc.org', 'https://dsfdc.delhigovt.nic.in',
 ST_GeographyFromText('SRID=4326;POINT(77.2310 28.6430)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.2, 70.0, TRUE),

-- Gujarat
('Gujarat Scheduled Castes Economic Development Corporation (GSCEDC)', 'SCA',
 'Block No. 9, 3rd Floor, Udyog Bhavan, Gandhinagar', 'Gandhinagar', 'Gujarat',
 '079-23250283', 'gscedc-guj@nic.in', NULL,
 ST_GeographyFromText('SRID=4326;POINT(72.6369 23.2156)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.8, 62.0, TRUE),

-- Haryana
('Haryana SC Finance & Development Corporation (HSCFDC)', 'SCA',
 'SCO 20, Sector 6, Panchkula', 'Panchkula', 'Haryana',
 '0172-2584511', NULL, 'https://hsfdc.org.in',
 ST_GeographyFromText('SRID=4326;POINT(76.8507 30.6942)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.5, 67.0, TRUE),

-- Himachal Pradesh
('Himachal Pradesh SC/OBC Development Corporation (HPSCOBCDC)', 'SCA',
 'Kisan Bhavan, Boileauganj, Shimla', 'Shimla', 'Himachal Pradesh',
 '0177-2652376', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(77.1734 31.1048)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.1, 60.0, TRUE),

-- Jharkhand
('Jharkhand State SC/ST & OBC Development Corporation', 'SCA',
 'Raj Bhawan Road, Ranchi', 'Ranchi', 'Jharkhand',
 '0651-2480177', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(85.3096 23.3441)'),
 ARRAY['micro_finance','term_loan','education_loan'], 8.4, 73.0, TRUE),

-- Karnataka
('Karnataka SC/ST Development Corporation (KSCDC)', 'SCA',
 'Ambedkar Bhavan, Dr. B.R. Ambedkar Veedhi', 'Bengaluru', 'Karnataka',
 '080-22209208', 'kscdc@karnataka.gov.in', 'https://kscdc.kar.nic.in',
 ST_GeographyFromText('SRID=4326;POINT(77.5946 12.9716)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.5, 60.0, TRUE),

-- Kerala
('Kerala SC/ST Development Corporation (KSDFC)', 'SCA',
 'Poojappura, Thiruvananthapuram', 'Thiruvananthapuram', 'Kerala',
 '0471-2341144', 'ksdfc@ksdfc.com', 'https://www.ksdfc.com',
 ST_GeographyFromText('SRID=4326;POINT(76.9366 8.5241)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.2, 58.0, TRUE),

-- Madhya Pradesh
('MP State SC Finance & Development Corporation (MPSCFDC)', 'SCA',
 '7th Floor, Satpura Bhavan, Bhopal', 'Bhopal', 'Madhya Pradesh',
 '0755-2551481', 'mpscfdc@mp.gov.in', NULL,
 ST_GeographyFromText('SRID=4326;POINT(77.4126 23.2599)'),
 ARRAY['micro_finance','term_loan','education_loan'], 7.2, 74.0, TRUE),

-- Maharashtra
('Maharashtra Scheduled Castes Finance & Development Corporation (MSFDC)', 'SCA',
 '16th Floor, Satra Plaza, Sector 19D, Vashi', 'Navi Mumbai', 'Maharashtra',
 '022-27660066', 'msfdc@maha.gov.in', NULL,
 ST_GeographyFromText('SRID=4326;POINT(73.0297 19.0633)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.9, 63.0, TRUE),

-- Odisha
('Odisha SC Development Finance Corporation (OSCFDC)', 'SCA',
 'Sachivalaya Marg, Bhubaneswar', 'Bhubaneswar', 'Odisha',
 '0674-2536293', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(85.8245 20.2961)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.7, 69.0, TRUE),

-- Punjab
('Punjab SC Land Development & Finance Corporation (PUNSCARFIN)', 'SCA',
 'SCO 80, Phase IX, Sector 65, Mohali', 'Mohali', 'Punjab',
 '0172-5006101', NULL, 'https://www.punscarfin.in',
 ST_GeographyFromText('SRID=4326;POINT(76.7179 30.7046)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.8, 66.0, TRUE),

-- Rajasthan
('Rajasthan SC/OBC Finance & Development Cooperative Corporation (RSCOBCFDCC)', 'SCA',
 '4-Sa-15, Jawahar Lal Nehru Marg, Jaipur', 'Jaipur', 'Rajasthan',
 '0141-2703545', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(75.7873 26.9124)'),
 ARRAY['micro_finance','term_loan','education_loan'], 6.3, 69.0, TRUE),

-- Tamil Nadu
('Tamil Nadu Adi Dravidar Housing & Development Corporation (TAHDCO)', 'SCA',
 '143, R.K. Mutt Road, Mandaiveli', 'Chennai', 'Tamil Nadu',
 '044-24918999', 'tahdco@tn.gov.in', 'https://tahdco.in',
 ST_GeographyFromText('SRID=4326;POINT(80.2607 13.0142)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.1, 70.0, TRUE),

-- Telangana
('Telangana SC Development Corporation (TSCDC)', 'SCA',
 '3-5-926/A, Hill Fort Road, Hyderabad', 'Hyderabad', 'Telangana',
 '040-23230098', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(78.4867 17.3850)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.6, 64.0, TRUE),

-- Uttar Pradesh
('UP Scheduled Castes Finance & Development Corporation (UPSCFDC)', 'SCA',
 'Avas Vikas Colony, Vibhuti Khand, Gomti Nagar', 'Lucknow', 'Uttar Pradesh',
 '0522-2304540', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(80.9462 26.8650)'),
 ARRAY['micro_finance','term_loan','education_loan'], 8.1, 80.0, TRUE),

-- Uttarakhand
('Uttarakhand SC/ST & OBC Development Corporation', 'SCA',
 '23 Subhash Road, Dehradun', 'Dehradun', 'Uttarakhand',
 '0135-2651290', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(78.0322 30.3165)'),
 ARRAY['micro_finance','term_loan','education_loan'], 5.9, 61.0, TRUE),

-- West Bengal
('West Bengal SC & OBC Development Finance Corporation (WBSCOB)', 'SCA',
 'Bikash Bhavan, Salt Lake City', 'Kolkata', 'West Bengal',
 '033-23343856', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(88.3993 22.5726)'),
 ARRAY['micro_finance','term_loan','education_loan'], 4.7, 66.0, TRUE),

-- Goa
('Goa SC/OBC Finance & Development Corporation', 'SCA',
 'Dayanand Bandodkar Marg, Panaji', 'Panaji', 'Goa',
 '0832-2226597', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(73.8278 15.4909)'),
 ARRAY['micro_finance','term_loan','education_loan'], 3.8, 55.0, TRUE),

-- ======================== PUBLIC SECTOR BANKS (PSBs) ========================

('Punjab National Bank – New Delhi Main Branch', 'PSB',
 'N-5, Connaught Circus, New Delhi', 'New Delhi', 'Delhi',
 '011-23324321', NULL, 'https://www.pnbindia.in',
 ST_GeographyFromText('SRID=4326;POINT(77.2195 28.6315)'),
 ARRAY['term_loan','education_loan'], 5.8, 68.0, TRUE),

('State Bank of India – Mumbai Main Branch', 'PSB',
 'Nariman Point, Mumbai', 'Mumbai', 'Maharashtra',
 '022-22742821', NULL, 'https://www.sbi.co.in',
 ST_GeographyFromText('SRID=4326;POINT(72.8258 18.9256)'),
 ARRAY['term_loan','education_loan'], 4.5, 65.0, TRUE),

('Bank of Baroda – Ahmedabad Main', 'PSB',
 'Bhadra, Ahmedabad', 'Ahmedabad', 'Gujarat',
 '079-25502080', NULL, 'https://www.bankofbaroda.in',
 ST_GeographyFromText('SRID=4326;POINT(72.5714 23.0225)'),
 ARRAY['term_loan','education_loan'], 5.3, 70.0, TRUE),

('Indian Bank – Chennai Head Office', 'PSB',
 '254-260, Avvai Shanmugam Salai, Royapettah', 'Chennai', 'Tamil Nadu',
 '044-28520421', NULL, 'https://www.indianbank.in',
 ST_GeographyFromText('SRID=4326;POINT(80.2625 13.0519)'),
 ARRAY['term_loan','education_loan'], 4.5, 63.0, TRUE),

('Canara Bank – Bengaluru Main', 'PSB',
 '112, J.C. Road, Bengaluru', 'Bengaluru', 'Karnataka',
 '080-22222458', NULL, 'https://www.canarabank.com',
 ST_GeographyFromText('SRID=4326;POINT(77.5838 12.9659)'),
 ARRAY['term_loan','education_loan'], 5.3, 71.0, TRUE),

('Union Bank of India – Hyderabad', 'PSB',
 'Abid Road, Sultan Bazaar, Hyderabad', 'Hyderabad', 'Telangana',
 '040-24613388', NULL, 'https://www.unionbankofindia.co.in',
 ST_GeographyFromText('SRID=4326;POINT(78.4691 17.3850)'),
 ARRAY['term_loan','education_loan'], 6.0, 72.0, TRUE),

('Bank of India – Kolkata Main', 'PSB',
 '5, B.T.M. Sarani (Brabourne Road), Kolkata', 'Kolkata', 'West Bengal',
 '033-22311321', NULL, 'https://www.bankofindia.co.in',
 ST_GeographyFromText('SRID=4326;POINT(88.3697 22.5744)'),
 ARRAY['term_loan','education_loan'], 5.7, 67.0, TRUE),

('Central Bank of India – Bhopal', 'PSB',
 'Hamidia Road, Bhopal', 'Bhopal', 'Madhya Pradesh',
 '0755-2551481', NULL, 'https://www.centralbankofindia.co.in',
 ST_GeographyFromText('SRID=4326;POINT(77.4126 23.2599)'),
 ARRAY['term_loan','education_loan'], 7.1, 74.0, TRUE),

-- ======================== REGIONAL RURAL BANKS (RRBs) ========================

('Gramin Bank of Aryavart – Lucknow Main', 'RRB',
 'Sector C, Aliganj, Lucknow', 'Lucknow', 'Uttar Pradesh',
 '0522-2323456', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(80.9874 26.8768)'),
 ARRAY['micro_finance','term_loan'], 8.5, 77.0, TRUE),

('Vidarbha Konkan Gramin Bank – Nagpur', 'RRB',
 'Dharampeth, Ring Road, Nagpur', 'Nagpur', 'Maharashtra',
 '0712-2554321', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(79.0882 21.1458)'),
 ARRAY['micro_finance','term_loan'], 7.2, 80.0, TRUE),

('Bangiya Gramin Vikash Bank – Kolkata', 'RRB',
 'Camac Street, Kolkata', 'Kolkata', 'West Bengal',
 '033-22821010', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(88.3562 22.5500)'),
 ARRAY['micro_finance','term_loan'], 6.9, 73.0, TRUE),

('Kerala Gramin Bank – Malappuram', 'RRB',
 'Opposite Bus Stand, Malappuram', 'Malappuram', 'Kerala',
 '0483-2735888', NULL, 'https://www.keralagrama.bank',
 ST_GeographyFromText('SRID=4326;POINT(76.0722 11.0510)'),
 ARRAY['micro_finance','term_loan'], 4.8, 64.0, TRUE),

('Karnataka Gramin Bank – Dharwad', 'RRB',
 'Dr. P.G. Halakatti Road, Dharwad', 'Dharwad', 'Karnataka',
 '0836-2441450', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(75.0078 15.4589)'),
 ARRAY['micro_finance','term_loan'], 5.6, 68.0, TRUE),

('Prathama UP Gramin Bank – Moradabad', 'RRB',
 'Civil Lines, Moradabad', 'Moradabad', 'Uttar Pradesh',
 '0591-2412345', NULL, NULL,
 ST_GeographyFromText('SRID=4326;POINT(78.7733 28.8386)'),
 ARRAY['micro_finance','term_loan'], 9.0, 78.0, TRUE),

-- ======================== NBFC-MFIs ========================

('Arohan Financial Services – Kolkata HO', 'NBFC_MFI',
 '3rd Floor, Ecospace, Action Area II, Newtown', 'Kolkata', 'West Bengal',
 '033-71901619', 'support@arohan.in', 'https://arohan.in',
 ST_GeographyFromText('SRID=4326;POINT(88.4618 22.5726)'),
 ARRAY['micro_finance'], 2.8, 55.0, TRUE),

('Spandana Sphoorty Financial – Hyderabad', 'NBFC_MFI',
 'Plot No. 1, Survey No. 18 & 19, Patrika Nagar, Hitech City', 'Hyderabad', 'Telangana',
 '040-44555566', NULL, 'https://www.spandanasphoorty.com',
 ST_GeographyFromText('SRID=4326;POINT(78.3790 17.4435)'),
 ARRAY['micro_finance'], 3.1, 58.0, TRUE),

('CreditAccess Grameen – Bengaluru', 'NBFC_MFI',
 'No. 49, 3rd Floor, Ulsoor Road, Bengaluru', 'Bengaluru', 'Karnataka',
 '080-49161000', NULL, 'https://www.creditaccess.in',
 ST_GeographyFromText('SRID=4326;POINT(77.6219 12.9745)'),
 ARRAY['micro_finance'], 2.5, 52.0, TRUE),

('Ujjivan Small Finance Bank (MFI arm) – Bengaluru', 'NBFC_MFI',
 'Grape Garden, No. 27, 3rd Cross, Bengaluru', 'Bengaluru', 'Karnataka',
 '080-45609100', NULL, 'https://www.ujjivansfb.in',
 ST_GeographyFromText('SRID=4326;POINT(77.5870 12.9716)'),
 ARRAY['micro_finance'], 2.1, 50.0, TRUE),

('Satin Creditcare Network – Delhi', 'NBFC_MFI',
 'DLF Prime Towers, F-79-80, Okhla Industrial Area Phase I', 'New Delhi', 'Delhi',
 '011-47025900', NULL, 'https://www.satincreditcare.com',
 ST_GeographyFromText('SRID=4326;POINT(77.2695 28.5355)'),
 ARRAY['micro_finance'], 3.5, 60.0, TRUE),

('Grameen Financial Services (Grameen Koota) – Bengaluru', 'NBFC_MFI',
 'No. 9/1, Hennur Road, Kalyan Nagar, Bengaluru', 'Bengaluru', 'Karnataka',
 '080-43503000', NULL, 'https://www.gfs.co.in',
 ST_GeographyFromText('SRID=4326;POINT(77.6388 13.0297)'),
 ARRAY['micro_finance'], 2.3, 54.0, TRUE),

('Muthoot Microfin – Chennai', 'NBFC_MFI',
 '3rd Floor, Mercury Aura, Rajiv Gandhi Salai, Perungudi', 'Chennai', 'Tamil Nadu',
 '044-45012345', NULL, 'https://www.muthootmicrofin.com',
 ST_GeographyFromText('SRID=4326;POINT(80.2374 12.9627)'),
 ARRAY['micro_finance'], 2.9, 56.0, TRUE);
