import { readonlyPool } from '../db/pool';
import type { UserEntities } from './ConversationSession';

export interface Scheme {
  id: number;
  name: string;
  short_name?: string | null;
  category: string;
  description: string;
  min_income_lakh?: number | null;
  max_income_lakh: number;
  min_loan_lakh?: number | null;
  max_loan_lakh: number;
  interest_rate_min: number;
  interest_rate_max: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_tenure_months: number;
  min_tenure_months?: number | null;
  coverage_percent?: number | null;
  eligible_project_types: string[];
  education_required: boolean;
  gender_eligibility?: string;
  age_min?: number | null;
  age_max?: number | null;
  documents_required?: string[] | null;
  channel_partner_types?: string[] | null;
  notes?: string | null;
  active?: boolean;
  scheme_type?: string;
  official_source?: string | null;
  official_source_url?: string | null;
  aliases?: string[] | null;
  current_official_name?: string | null;
  channel_partner_applicable?: boolean;
}

export type SchemeTier = 'ELIGIBLE_OPTIMAL' | 'ELIGIBLE_SUBOPTIMAL' | 'HARD_DISQUALIFIED';

export interface ScoredScheme extends Scheme {
  score: number;
  tier: SchemeTier;
  matchReasons: string[];
  warnings: string[];
  disqualificationReason?: string;
}

export function normalizeSchemeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchActiveSchemes(category?: string): Promise<Scheme[]> {
  const { rows } = await readonlyPool.query<Scheme>(
    `SELECT * FROM schemes WHERE active = TRUE ${category ? "AND category = $1" : ""} ORDER BY interest_rate_min ASC`,
    category ? [category] : []
  );
  return rows;
}

export async function fetchSchemeById(id: number): Promise<Scheme | null> {
  const { rows } = await readonlyPool.query<Scheme>('SELECT * FROM schemes WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function fetchSchemeByName(name: string): Promise<Scheme | null> {
  const all = await fetchActiveSchemes();
  const normInput = normalizeSchemeText(name);

  for (const s of all) {
    const parensMatch = s.name.match(/\(([^)]+)\)/);
    const acronym = parensMatch ? normalizeSchemeText(parensMatch[1]) : '';
    const baseName = normalizeSchemeText(s.name.replace(/\([^)]+\)/, ''));
    const fullName = normalizeSchemeText(s.name);
    const shortName = s.short_name ? normalizeSchemeText(s.short_name) : '';
    const normAliases = (s.aliases || []).map((a) => normalizeSchemeText(a));

    if (
      (acronym && (normInput === acronym || normInput.split(' ').includes(acronym))) ||
      (shortName && (normInput === shortName || normInput.split(' ').includes(shortName))) ||
      (baseName && (normInput === baseName || normInput.includes(baseName) || baseName.includes(normInput))) ||
      (fullName && (normInput === fullName || normInput.includes(fullName) || fullName.includes(normInput))) ||
      normAliases.some((alias) => alias.length >= 2 && (normInput === alias || normInput.includes(alias) || alias.includes(normInput)))
    ) {
      return s;
    }
  }

  const { rows } = await readonlyPool.query<Scheme>(
    "SELECT * FROM schemes WHERE name ILIKE $1 OR short_name ILIKE $1 OR array_to_string(aliases, ',') ILIKE $1 LIMIT 1",
    [`%${name}%`]
  );
  return rows[0] || null;
}

function purposeMatchScore(scheme: Scheme, purpose: string | undefined): number {
  const p = (purpose || '').trim();
  if (!p) return 15;

  const normP = normalizeSchemeText(p);
  const pTokens = normP.split(/\s+/).filter(Boolean);

  const parensMatch = scheme.name.match(/\(([^)]+)\)/);
  const acronym = parensMatch ? parensMatch[1].trim() : '';
  const baseName = scheme.name.replace(/\([^)]+\)/, '').trim();

  const normAcronym = normalizeSchemeText(acronym);
  const normBaseName = normalizeSchemeText(baseName);
  const normFullName = normalizeSchemeText(scheme.name);
  const normShortName = scheme.short_name ? normalizeSchemeText(scheme.short_name) : '';
  const normAliases = (scheme.aliases || []).map((a) => normalizeSchemeText(a));

  // Check direct scheme match against acronym, short_name, base_name, full_name, or aliases
  const isAcronymMatch = normAcronym.length > 0 && (normP === normAcronym || pTokens.includes(normAcronym));
  const isShortMatch = normShortName.length > 0 && (normP === normShortName || pTokens.includes(normShortName));
  const isFullNameMatch = normFullName.length >= 3 && (normP === normFullName || normP.includes(normFullName) || normFullName.includes(normP));
  const isBaseNameMatch = normBaseName.length >= 3 && (normP === normBaseName || normP.includes(normBaseName) || normBaseName.includes(normP));
  const isAliasMatch = normAliases.some((alias) => alias.length >= 2 && (normP === alias || normP.includes(alias) || alias.includes(normP)));

  if (isAcronymMatch || isShortMatch || isFullNameMatch || isBaseNameMatch || isAliasMatch) {
    const rawTypes = scheme.eligible_project_types || [];
    const normalizedTypes = rawTypes.map((t) => t.toLowerCase().replace(/[-_]/g, ' '));
    const tokenBonus = normalizedTypes.some((t) => normP.includes(t)) ? 20 : 0;
    return 100 + tokenBonus;
  }

  const rawTypes = scheme.eligible_project_types || [];
  const normalizedTypes = rawTypes.map((t) => t.toLowerCase().replace(/[-_]/g, ' '));

  const sanitationWords = ['waste', 'recycling', 'sanitation', 'garbage', 'sewage', 'toilet', 'scavenger', 'cleaning', 'safai', 'सफाई', 'कचरा', 'शौचालय', 'स्वच्छता'];
  const greenWords = ['green', 'electric', 'rickshaw', 'solar', 'biogas', 'polyhouse', 'organic', 'eco', 'renewable', 'ev', 'ई-रिक्शा', 'सौर', 'पर्यावरण'];
  const artisanWords = ['artisan', 'handicraft', 'weaving', 'craft', 'pottery', 'woodwork', 'sculpture', 'textile', 'carpet', 'embroidery', 'शिल्पकार', 'बुनकर', 'हस्तकला', 'हस्तशिल्प'];
  const businessWords = ['tailoring', 'shop', 'grocery', 'kirana', 'trade', 'enterprise', 'business', 'store', 'restaurant', 'hotel', 'manufacturing', 'repair', 'सिलाई', 'दुकान', 'व्यापार', 'व्यवसाय', 'शिलाई', 'उद्योग'];
  const agriWords = ['agriculture', 'farming', 'poultry', 'animal', 'cattle', 'horticulture', 'dairy', 'crop', 'fisheries', 'खेती', 'कृषि', 'डेयरी', 'पशुपालन', 'शेतकरी'];
  const techWords = ['saas', 'software', 'tech', 'it', 'b2b', 'supplier', 'suppliers', 'supply', 'logistics', 'services', 'agency', 'wholesale', 'सॉफ्टवेयर', 'तकनीक', 'सप्लायर'];
  const educationWords = [
    'education', 'study', 'college', 'school', 'engineering', 'medical', 'degree', 'student',
    'scholarship', 'university', 'course', 'vocational', 'tuition', 'btech', 'mtech', 'mba', 'mbbs',
    'शिक्षा', 'पढ़ाई', 'सिक्षा', 'शिक्षण', 'इंजीनियरिंग', 'कोर्स',
    'ಶಿಕ್ಷಣ', 'ಸಾಹಿತ್ಯ', 'ಅಧ್ಯಯನ', 'ಕಾಲೇಜು', 'ವಿದ್ಯಾಭ್ಯಾಸ', 'ಎಂಜಿನಿಯರಿಂಗ್',
    'શિક્ષણ', 'கல்வி', 'విద్య', 'വിദ്യാഭ്യാസം', 'ଶିକ୍ଷା', 'ਸਿੱਖਿਆ'
  ];

  const isSanitationScheme = scheme.name.includes('Swachhta') || scheme.name.includes('SUY');
  const isGreenScheme = scheme.name.includes('Green') || scheme.name.includes('GBS');
  const isArtisanScheme = scheme.name.includes('Shilpi') || scheme.name.includes('SSY');
  const isAgriScheme = scheme.name.includes('Kisan') || scheme.name.includes('MKY');
  const isEducationScheme = scheme.category === 'education_loan' || scheme.education_required;

  if (normP) {
    if (educationWords.some((w) => normP.includes(w))) {
      if (isEducationScheme) return 50;
      return -15;
    }
    if (sanitationWords.some((w) => normP.includes(w))) {
      if (isSanitationScheme) return 50;
      return 5;
    }
    if (greenWords.some((w) => normP.includes(w))) {
      if (isGreenScheme) return 50;
      return 10;
    }
    if (artisanWords.some((w) => normP.includes(w))) {
      if (isArtisanScheme) return 50;
      return 10;
    }
    if (agriWords.some((w) => normP.includes(w))) {
      if (isAgriScheme) return 50;
      if (scheme.name.includes('Term Loan')) return 30;
      return 5;
    }
    if (techWords.some((w) => normP.includes(w))) {
      if (scheme.name.includes('Term Loan') || scheme.name.includes('Utkarsh') || normalizedTypes.includes('services') || normalizedTypes.includes('it services')) {
        return 40;
      }
      return 5;
    }
    if (businessWords.some((w) => normP.includes(w))) {
      if (isAgriScheme) return -30;
      if (isSanitationScheme || isArtisanScheme) return -15;
      if (normP.includes('सिलाई') || normP.includes('tailoring') || normP.includes('शिलाई')) {
        if (scheme.name.includes('Mahila Samriddhi')) return 50;
        if (normalizedTypes.some((t) => t.includes('tailoring'))) return 45;
      }
      if (normalizedTypes.some((t) => businessWords.some((w) => normP.includes(w) && t.includes(w)))) return 45;
      if (scheme.name.includes('Term Loan') || scheme.name.includes('Micro Credit Finance') || scheme.name.includes('Laghu Vyavasaya') || scheme.name.includes('Mahila Samriddhi')) {
        return 40;
      }
      return 15;
    }

    const pWords = normP.split(/\s+/).filter((w) => w.length > 2);
    const typeWords = normalizedTypes.flatMap((t) => t.split(/\s+/));
    if (pWords.some((w) => typeWords.includes(w))) return 35;
  }

  if (isSanitationScheme || isArtisanScheme || isAgriScheme) return -30;
  if (isGreenScheme) return -15;

  return 15;
}

function incomeScore(scheme: Scheme, incomeRs: number | undefined): { score: number; warning?: string } {
  if (!incomeRs) return { score: 10 };
  const incomeLakh = incomeRs / 100000;

  if (incomeLakh > scheme.max_income_lakh) {
    return {
      score: -10,
      warning: `Annual family income (₹${incomeLakh.toFixed(1)}L) exceeds the standard NSFDC concessional limit (₹${scheme.max_income_lakh}L/yr). Official guidelines apply.`,
    };
  }
  if (scheme.min_income_lakh && incomeLakh < scheme.min_income_lakh) {
    return {
      score: -5,
      warning: `Your income may be below the minimum requirement for this scheme`,
    };
  }
  return { score: 20 };
}

function loanAmountScore(scheme: Scheme, amountRs: number | undefined): { score: number; warning?: string } {
  if (!amountRs) return { score: 10 };
  const amountLakh = amountRs / 100000;

  if (amountLakh > scheme.max_loan_lakh) {
    return {
      score: -20,
      warning: `Required amount (₹${amountLakh.toFixed(1)}L) exceeds this scheme's maximum limit (₹${scheme.max_loan_lakh}L)`,
    };
  }
  if (scheme.min_loan_lakh && amountLakh < scheme.min_loan_lakh) {
    return { score: -10, warning: `Your requirement is below the minimum loan for this scheme` };
  }
  return { score: 25 };
}

function educationScore(scheme: Scheme, isEducation: boolean): number {
  if (isEducation && scheme.education_required) return 50;
  if (isEducation && !scheme.education_required) return 0;
  if (!isEducation && scheme.education_required) return -150;
  return 5;
}

function genderScore(scheme: Scheme, gender: string | undefined): { score: number; warning?: string } {
  const isWomenOnly = scheme.gender_eligibility === 'women_only' || scheme.name.toLowerCase().includes('mahila');
  if (isWomenOnly) {
    if (gender === 'female') {
      return { score: 25 };
    }
    return { score: -300, warning: 'This scheme is exclusively for women applicants' };
  }
  return { score: 0 };
}

const MULTILINGUAL_EDUCATION_WORDS = [
  'education', 'study', 'college', 'school', 'engineering', 'medical', 'degree', 'student',
  'scholarship', 'university', 'course', 'vocational', 'tuition', 'btech', 'mtech', 'mba', 'mbbs',
  'शिक्षा', 'पढ़ाई', 'सिक्षा', 'शिक्षण', 'इंजीनियरिंग', 'कोर्स',
  'ಶಿಕ್ಷಣ', 'ಸಾಹಿತ್ಯ', 'ಅಧ್ಯಯನ', 'ಕಾಲೇಜು', 'ವಿದ್ಯಾಭ್ಯಾಸ', 'ಎಂಜಿನಿಯರಿಂಗ್',
  'શિક્ષણ', 'கல்வி', 'విద్య', 'വിദ്യാഭ്യാസം', 'ଶିକ୍ଷା', 'ਸਿੱਖਿਆ'
];

export function scoreSchemes(schemes: Scheme[], entities: UserEntities, categoryHint?: string): ScoredScheme[] {
  const pNorm = (entities.purpose || '').toLowerCase();
  const isEduCategory = categoryHint === 'education_loan' || (schemes.length > 0 && schemes.every((s) => s.category === 'education_loan'));
  const isEduPurpose = MULTILINGUAL_EDUCATION_WORDS.some((w) => pNorm.includes(w.toLowerCase()));
  const isEducation = !!(
    isEduCategory ||
    isEduPurpose ||
    entities.education_level ||
    entities.course
  );

  const scored = schemes
    .map((scheme): ScoredScheme => {
      let score = 0;
      const matchReasons: string[] = [];
      const warnings: string[] = [];

      const pScore = purposeMatchScore(scheme, entities.purpose);
      score += pScore;
      if (pScore >= 30) matchReasons.push('Purpose matches this scheme\'s eligible activities');

      const isDirectMatch = pScore >= 100;

      const { score: iScore, warning: iWarn } = incomeScore(scheme, entities.family_income_rs);
      score += iScore;
      if (iWarn) warnings.push(iWarn);
      else if (entities.family_income_rs) matchReasons.push('Income falls within eligible threshold');

      const { score: lScore, warning: lWarn } = loanAmountScore(scheme, entities.loan_amount_rs);
      score += lScore;
      if (lWarn) warnings.push(lWarn);
      else if (entities.loan_amount_rs) matchReasons.push('Loan requirement fits within scheme limits');

      let eScore = educationScore(scheme, isEducation);
      if (isDirectMatch && eScore < 0 && scheme.education_required) {
        eScore = 50;
      }
      score += eScore;
      if ((isEducation || isDirectMatch) && scheme.education_required) matchReasons.push('Designed for education/vocational financing');

      let { score: gScore, warning: gWarn } = genderScore(scheme, entities.gender);
      if (isDirectMatch && gScore < 0) {
        gScore = 0;
      }
      score += gScore;
      if (gWarn) warnings.push(gWarn);
      else if (entities.gender === 'female' && gScore > 0) matchReasons.push('Exclusive concessional scheme for women entrepreneurs');

      score += Math.max(0, (10 - Number(scheme.interest_rate_min || 6)) * 2);

      // --- 3-TIER DETERMINISTIC CLASSIFICATION (SIH PS 26092) ---
      let tier: SchemeTier = 'ELIGIBLE_SUBOPTIMAL';
      let disqualificationReason: string | undefined = undefined;

      const loanLakh = entities.loan_amount_rs ? entities.loan_amount_rs / 100000 : null;
      const incomeLakh = entities.family_income_rs ? entities.family_income_rs / 100000 : null;
      const isWomenOnly = scheme.gender_eligibility === 'women_only' || scheme.name.toLowerCase().includes('mahila');

      // Boundary check 1: Loan ceiling exceeded (e.g. ₹55L > ₹50L Term Loan cap)
      if (loanLakh && scheme.max_loan_lakh && loanLakh > scheme.max_loan_lakh) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Requested loan amount (₹${loanLakh.toFixed(1)}L) exceeds the maximum statutory ceiling of ₹${scheme.max_loan_lakh.toFixed(1)}L for ${scheme.name}.`;
      }
      // Boundary check 2: Family income exceeded (e.g. > ₹5.00L universal cap)
      else if (incomeLakh && scheme.max_income_lakh && incomeLakh > scheme.max_income_lakh) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `Annual family income (₹${incomeLakh.toFixed(1)}L) exceeds the statutory eligibility cap of ₹${scheme.max_income_lakh.toFixed(1)}L/yr for NSFDC concessional loans.`;
      }
      // Boundary check 3: Gender exclusivity
      else if (isWomenOnly && entities.gender && entities.gender !== 'female' && !isDirectMatch) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `This scheme is exclusively reserved for women entrepreneurs.`;
      }
      // Boundary check 4: Education requirement when completely non-educational
      else if (scheme.education_required && !isEducation && !isDirectMatch) {
        tier = 'HARD_DISQUALIFIED';
        disqualificationReason = `This scheme requires enrollment in an eligible technical, vocational, or professional course.`;
      }
      // Qualified schemes: Segment into OPTIMAL (score >= 80) vs SUBOPTIMAL (score 50–79)
      else if (score >= 80) {
        tier = 'ELIGIBLE_OPTIMAL';
      } else {
        tier = 'ELIGIBLE_SUBOPTIMAL';
      }

      if (tier === 'HARD_DISQUALIFIED') {
        if (disqualificationReason && !warnings.includes(disqualificationReason)) {
          warnings.unshift(disqualificationReason);
        }
        if (!isDirectMatch && score > 40) {
          score = 40;
        }
      }

      return { ...scheme, score, tier, matchReasons, warnings, disqualificationReason };
    })
    .filter((s) => s.score > -30)
    .sort((a, b) => {
      // Prioritize by tier first: OPTIMAL (1) > SUBOPTIMAL (2) > HARD_DISQUALIFIED (3)
      const tierRank = (t: SchemeTier) => (t === 'ELIGIBLE_OPTIMAL' ? 1 : t === 'ELIGIBLE_SUBOPTIMAL' ? 2 : 3);
      const rankDiff = tierRank(a.tier) - tierRank(b.tier);
      if (rankDiff !== 0) return rankDiff;
      return b.score - a.score;
    });

  return scored;
}

export async function recommendSchemes(entities: UserEntities, categoryHint?: string): Promise<ScoredScheme[]> {
  const all = await fetchActiveSchemes(categoryHint);
  const scored = scoreSchemes(all, entities, categoryHint);
  if (scored.length === 0) {
    return all.slice(0, 3).map((s) => ({
      ...s,
      score: 50,
      tier: 'ELIGIBLE_SUBOPTIMAL' as SchemeTier,
      matchReasons: ['Official NSFDC Concessional Scheme'],
      warnings: [],
    }));
  }
  return scored.slice(0, 3);
}
