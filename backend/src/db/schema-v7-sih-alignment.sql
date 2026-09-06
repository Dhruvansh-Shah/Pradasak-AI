-- Migration v7: SIH Problem Statement ID 26092 Alignment (MoSJE / NSFDC)
-- Aligns Micro Credit Finance (MCF) ceiling to ₹1.40 Lakh, Term Loan to ₹50.00 Lakh,
-- and universal annual family income eligibility to ₹5.00 Lakh.

BEGIN;

-- 1. Micro Credit Finance (MCF) - ID 1
UPDATE schemes
SET max_loan_lakh = 1.40,
    min_loan_lakh = 0.10,
    max_income_lakh = 5.00,
    notes = 'NSFDC lends to SCA @ 2.5%; SCA lends to beneficiary @ 6.5%. Repayment in quarterly instalments within 3 years including 3-month moratorium. Project cost up to ₹1.40 lakh as per MoSJE PS 26092.'
WHERE id = 1;

-- 2. Mahila Samriddhi Yojana (MSY) - ID 2
UPDATE schemes
SET max_loan_lakh = 1.40,
    min_loan_lakh = 0.05,
    max_income_lakh = 5.00,
    notes = 'WOMEN ONLY. Concessional micro-credit up to ₹1.40 lakh. NSFDC lends to SCA @ 1%; SCA lends to beneficiary @ 4%. Interest rebate of 0.5% for timely repayment.'
WHERE id = 2;

-- 3. Mahila Adhikarita Yojana (MAY) - ID 3
UPDATE schemes
SET max_income_lakh = 5.00
WHERE id = 3;

-- 4. Shilpi Samriddhi Yojana (SSY) - ID 4
UPDATE schemes
SET max_income_lakh = 5.00
WHERE id = 4;

-- 5. Term Loan (TL) - ID 5
UPDATE schemes
SET max_loan_lakh = 50.00,
    min_loan_lakh = 0.50,
    max_income_lakh = 5.00,
    notes = 'Flagship large project loan scheme up to ₹50 lakh as per MoSJE PS 26092. NSFDC charges 4% to SCAs/CAs; beneficiaries pay 6.0–8.0% p.a.'
WHERE id = 5;

-- 6. Green Business Scheme (GBS) - ID 6
UPDATE schemes
SET max_income_lakh = 5.00
WHERE id = 6;

-- 7. Swachhta Udyami Yojana (SUY) - ID 7
UPDATE schemes
SET max_income_lakh = 5.00
WHERE id = 7;

-- 8. Udyam Nidhi Yojana (UNY) - ID 8
UPDATE schemes
SET max_income_lakh = 5.00
WHERE id = 8;

-- 9. Aajeevika Microfinance Yojana (AMY) - ID 9
UPDATE schemes
SET max_loan_lakh = 1.40,
    max_income_lakh = 5.00,
    notes = 'Routed EXCLUSIVELY through selected NBFC-MFIs for micro projects up to ₹1.40 lakh. Beneficiary rate 15% p.a. (NSFDC charges NBFC-MFI 5%).'
WHERE id = 9;

-- Universal income limit alignment for any remaining schemes
UPDATE schemes
SET max_income_lakh = 5.00
WHERE max_income_lakh < 5.00;

COMMIT;
