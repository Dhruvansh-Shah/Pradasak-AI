import { scoreSchemes } from '../services/SchemeEngine';
import { classifyIntent, detectLanguage } from '../services/IntentClassifier';
import { geocodeCity } from '../services/LocationService';
import type { Scheme } from '../services/SchemeEngine';
import type { UserEntities } from '../services/ConversationSession';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

const mockSchemes: Scheme[] = [
  {
    id: 1,
    name: 'Micro Credit Finance (MCF)',
    category: 'micro_finance',
    description: 'Small loans for micro business',
    min_income_lakh: 0,
    max_income_lakh: 3.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 1.25,
    interest_rate_min: 6.5,
    interest_rate_max: 6.5,
    moratorium_months_min: 3,
    moratorium_months_max: 3,
    max_tenure_months: 36,
    coverage_percent: 90,
    eligible_project_types: ['small_trade', 'tailoring', 'grocery', 'repair_services'],
    education_required: false,
    gender_eligibility: 'all',
  },
  {
    id: 2,
    name: 'Mahila Samriddhi Yojana (MSY)',
    category: 'micro_finance',
    description: 'Exclusive micro-credit for women',
    min_income_lakh: 0,
    max_income_lakh: 3.0,
    min_loan_lakh: 0.05,
    max_loan_lakh: 1.25,
    interest_rate_min: 4.0,
    interest_rate_max: 4.0,
    moratorium_months_min: 3,
    moratorium_months_max: 6,
    max_tenure_months: 42,
    coverage_percent: 90,
    eligible_project_types: ['small_trade', 'tailoring', 'handicraft'],
    education_required: false,
    gender_eligibility: 'women_only',
  },
  {
    id: 6,
    name: 'Term Loan (TL)',
    category: 'term_loan',
    description: 'Flagship enterprise loan',
    min_income_lakh: 0,
    max_income_lakh: 5.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 27.0,
    interest_rate_min: 6.0,
    interest_rate_max: 8.0,
    moratorium_months_min: 6,
    moratorium_months_max: 12,
    max_tenure_months: 120,
    coverage_percent: 90,
    eligible_project_types: ['manufacturing', 'transport', 'grocery_wholesale', 'services'],
    education_required: false,
    gender_eligibility: 'all',
  },
  {
    id: 9,
    name: 'Swachhta Udayami Yojana (SUY)',
    category: 'term_loan',
    description: 'Sanitation enterprise loan',
    min_income_lakh: 0,
    max_income_lakh: 3.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 13.5,
    interest_rate_min: 3.0,
    interest_rate_max: 4.0,
    moratorium_months_min: 6,
    moratorium_months_max: 6,
    max_tenure_months: 120,
    coverage_percent: 90,
    eligible_project_types: ['sanitation_enterprise', 'waste_recycling', 'garbage_transport'],
    education_required: false,
    gender_eligibility: 'all',
  },
  {
    id: 12,
    name: 'Education Loan Scheme (ELS)',
    category: 'education_loan',
    description: 'Higher education in India/abroad',
    min_income_lakh: 0,
    max_income_lakh: 5.0,
    min_loan_lakh: 0.1,
    max_loan_lakh: 40.0,
    interest_rate_min: 3.5,
    interest_rate_max: 4.0,
    moratorium_months_min: 12,
    moratorium_months_max: 12,
    max_tenure_months: 144,
    coverage_percent: 90,
    eligible_project_types: ['education', 'engineering', 'medicine', 'management'],
    education_required: true,
    gender_eligibility: 'all',
  },
];

console.log('\n================== RUNNING UNIT TESTS ==================\n');

// ── 1. Scheme Engine & Demographic Filter Tests ──
console.log('📦 Testing SchemeEngine (Demographics & Scoring):');

// Test 1.1: General/Male user should NOT receive Mahila scheme
const maleTailoring: UserEntities = { purpose: 'tailoring', loan_amount_rs: 100000, gender: 'male' };
const maleTailoringResults = scoreSchemes(mockSchemes, maleTailoring);
assert(
  !maleTailoringResults.some((s) => s.name.includes('Mahila')),
  'Male applicant does NOT receive Mahila schemes'
);

// Test 1.2: Unspecified gender user should NOT receive Mahila scheme
const generalGrocery: UserEntities = { purpose: 'grocery shop', loan_amount_rs: 100000 };
const generalGroceryResults = scoreSchemes(mockSchemes, generalGrocery);
assert(
  !generalGroceryResults.some((s) => s.name.includes('Mahila')),
  'Unspecified gender applicant does NOT receive Mahila schemes'
);

// Test 1.3: Female user receives Mahila Samriddhi Yojana with top rank
const femaleTailoring: UserEntities = { purpose: 'tailoring', loan_amount_rs: 100000, gender: 'female' };
const femaleTailoringResults = scoreSchemes(mockSchemes, femaleTailoring);
assert(
  femaleTailoringResults[0]?.name.includes('Mahila Samriddhi'),
  'Female applicant receives Mahila Samriddhi Yojana as top match'
);

// Test 1.4: Sanitation purpose specifically matches Swachhta Udayami Yojana
const wasteRecycling: UserEntities = { purpose: 'waste recycling vehicle', loan_amount_rs: 500000 };
const wasteResults = scoreSchemes(mockSchemes, wasteRecycling);
assert(
  wasteResults[0]?.name.includes('Swachhta Udayami'),
  'Waste management purpose specifically matches Swachhta Udayami Yojana'
);

// Test 1.5: Education purpose specifically matches Education Loan Scheme
const eduQuery: UserEntities = { purpose: 'MS in Computer Science', loan_amount_rs: 2000000, course: 'MS' };
const eduResults = scoreSchemes(mockSchemes, eduQuery);
assert(
  eduResults[0]?.name.includes('Education Loan Scheme'),
  'Academic purpose matches Education Loan Scheme'
);

// Test 1.6: High income generates warning without disqualifying Term Loan
const highIncome: UserEntities = { purpose: 'manufacturing enterprise', loan_amount_rs: 1000000, family_income_rs: 1000000 };
const highIncomeResults = scoreSchemes(mockSchemes, highIncome);
assert(
  highIncomeResults.length > 0 && highIncomeResults[0].warnings.length > 0,
  'Income > ₹5L attaches clear warning without discarding scheme'
);

// ── 2. Intent Classifier Tests ──
console.log('\n🧠 Testing IntentClassifier:');

// Test 2.1: Substantive questions with polite greetings are NOT swallowed as greetings
const politeLoan = classifyIntent('नमस्ते, मुझे सिलाई का काम शुरू करने के लिए 1 लाख चाहिए');
assert(politeLoan.intent === 'business_loan' || politeLoan.intent === 'scheme_recommendation', 'Greeting preceding loan query routes to loan intent');

// Test 2.2: Pure greetings return greeting intent
const pureGreeting = classifyIntent('Hello good morning');
assert(pureGreeting.intent === 'greeting', 'Pure greeting returns greeting intent');

// Test 2.3: EMI inquiries return emi_calculation intent
const emiInquiry = classifyIntent('Calculate EMI for 5 lakhs at 6% for 5 years');
assert(emiInquiry.intent === 'emi_calculation', 'EMI calculation inquiry correctly classified');

// Test 2.4: Language detection
assert(detectLanguage('मुझे अमरावती में लोन चाहिए') === 'hi', 'Hindi Devanagari detected as "hi"');
assert(detectLanguage('मला अमरावती मध्ये कर्ज हवे आहे') === 'mr', 'Marathi Devanagari detected as "mr"');
assert(detectLanguage('I want an education loan') === 'en', 'English detected as "en"');

// ── 3. Location Service Tests ──
console.log('\n📍 Testing LocationService:');

const amravatiPt = geocodeCity('amravati');
assert(amravatiPt !== null && Math.abs(amravatiPt.lat - 20.9374) < 0.01, 'Amravati coordinates accurately mapped');

const nagpurPt = geocodeCity('nagpur');
assert(nagpurPt !== null && Math.abs(nagpurPt.lat - 21.1458) < 0.01, 'Nagpur coordinates accurately mapped');

console.log(`\n================== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ==================\n`);
process.exit(failed > 0 ? 1 : 0);
