import { readonlyPool } from '../db/pool';
import type { UserEntities } from './ConversationSession';

export interface Scheme {
  id: number;
  name: string;
  short_name: string | null;
  category: string;
  description: string;
  min_income_lakh: number | null;
  max_income_lakh: number;
  min_loan_lakh: number | null;
  max_loan_lakh: number;
  interest_rate_min: number;
  interest_rate_max: number;
  moratorium_months_min: number;
  moratorium_months_max: number;
  max_tenure_months: number;
  min_tenure_months: number | null;
  coverage_percent: number | null;
  eligible_project_types: string[];
  education_required: boolean;
  gender_eligibility: string;
  age_min: number | null;
  age_max: number | null;
  documents_required: string[] | null;
  channel_partner_types: string[] | null;
  notes: string | null;
  active: boolean;
}

export interface ScoredScheme extends Scheme {
  score: number;
  matchReasons: string[];
  warnings: string[];
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
  const { rows } = await readonlyPool.query<Scheme>(
    "SELECT * FROM schemes WHERE name ILIKE $1 OR short_name ILIKE $1 LIMIT 1",
    [`%${name}%`]
  );
  return rows[0] || null;
}

function purposeMatchScore(scheme: Scheme, purpose: string | undefined): number {
  const p = (purpose || '').toLowerCase().replace(/[-_]/g, ' ');
  const rawTypes = scheme.eligible_project_types || [];
  const normalizedTypes = rawTypes.map((t) => t.toLowerCase().replace(/[-_]/g, ' '));

  // Semantic groups (Multilingual support for English, Hindi, and Marathi terms)
  const sanitationWords = ['waste', 'recycling', 'sanitation', 'garbage', 'sewage', 'toilet', 'scavenger', 'cleaning', 'safai', 'सफाई', 'कचरा', 'शौचालय', 'स्वच्छता'];
  const greenWords = ['green', 'electric', 'rickshaw', 'solar', 'biogas', 'polyhouse', 'organic', 'eco', 'renewable', 'ev', 'ई-रिक्शा', 'सौर', 'पर्यावरण'];
  const artisanWords = ['artisan', 'handicraft', 'weaving', 'craft', 'pottery', 'woodwork', 'sculpture', 'textile', 'carpet', 'embroidery', 'शिल्पकार', 'बुनकर', 'हस्तकला', 'हस्तशिल्प'];
  const businessWords = ['tailoring', 'shop', 'grocery', 'kirana', 'trade', 'enterprise', 'business', 'store', 'restaurant', 'hotel', 'manufacturing', 'repair', 'सिलाई', 'दुकान', 'व्यापार', 'व्यवसाय', 'शिलाई', 'उद्योग'];
  const agriWords = ['agriculture', 'farming', 'poultry', 'animal', 'cattle', 'horticulture', 'dairy', 'crop', 'fisheries', 'खेती', 'कृषि', 'डेयरी', 'पशुपालन', 'शेतकरी'];
  const techWords = ['saas', 'software', 'tech', 'it', 'b2b', 'supplier', 'suppliers', 'supply', 'logistics', 'services', 'agency', 'wholesale', 'सॉफ्टवेयर', 'तकनीक', 'सप्लायर'];

  const isSanitationScheme = scheme.name.includes('Swachhta') || scheme.name.includes('SUY');
  const isGreenScheme = scheme.name.includes('Green') || scheme.name.includes('GBS');
  const isArtisanScheme = scheme.name.includes('Shilpi') || scheme.name.includes('SSY');
  const isAgriScheme = scheme.name.includes('Kisan') || scheme.name.includes('MKY');

  if (p) {
    if (sanitationWords.some((w) => p.includes(w))) {
      if (isSanitationScheme) return 50;
      return 5;
    }
    if (greenWords.some((w) => p.includes(w))) {
      if (isGreenScheme) return 50;
      return 10;
    }
    if (artisanWords.some((w) => p.includes(w))) {
      if (isArtisanScheme) return 50;
      return 10;
    }
    if (agriWords.some((w) => p.includes(w))) {
      if (isAgriScheme) return 50;
      if (scheme.name.includes('Term Loan')) return 30;
      return 5;
    }
    if (techWords.some((w) => p.includes(w))) {
      if (scheme.name.includes('Term Loan') || scheme.name.includes('Utkarsh') || normalizedTypes.includes('services') || normalizedTypes.includes('it services')) {
        return 40;
      }
      return 5;
    }
    if (businessWords.some((w) => p.includes(w))) {
      if (isAgriScheme) return -30; // Kisan schemes are strictly for agriculture/farming
      if (isSanitationScheme || isArtisanScheme) return -15;
      if (p.includes('सिलाई') || p.includes('tailoring') || p.includes('शिलाई')) {
        if (scheme.name.includes('Mahila Samriddhi')) return 50;
        if (normalizedTypes.some((t) => t.includes('tailoring'))) return 45;
      }
      if (normalizedTypes.some((t) => businessWords.some((w) => p.includes(w) && t.includes(w)))) return 45;
      if (scheme.name.includes('Term Loan') || scheme.name.includes('Micro Credit Finance') || scheme.name.includes('Laghu Vyavasaya') || scheme.name.includes('Mahila Samriddhi')) {
        return 40;
      }
      return 15;
    }

    // Direct token overlap
    const pWords = p.split(/\s+/).filter((w) => w.length > 2);
    const typeWords = normalizedTypes.flatMap((t) => t.split(/\s+/));
    if (pWords.some((w) => typeWords.includes(w))) return 35;
  }

  // If user didn't specify purpose, don't randomly prioritize niche schemes
  if (isSanitationScheme || isArtisanScheme || isAgriScheme) return -30;
  if (isGreenScheme) return -15;

  return 15;
}

function incomeScore(scheme: Scheme, incomeRs: number | undefined): { score: number; warning?: string } {
  if (!incomeRs) return { score: 10 }; // no info — give benefit of doubt
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
  if (isEducation && !scheme.education_required) return -40;
  if (!isEducation && scheme.education_required) return -150;
  return 5;
}

function genderScore(scheme: Scheme, gender: string | undefined): { score: number; warning?: string } {
  const isWomenOnly = scheme.gender_eligibility === 'women_only' || scheme.name.toLowerCase().includes('mahila');
  if (isWomenOnly) {
    if (gender === 'female') {
      return { score: 25 };
    }
    // Strictly penalize for male or unspecified applicants so Mahila schemes are only offered to women
    return { score: -300, warning: 'This scheme is exclusively for women applicants' };
  }
  return { score: 0 };
}

export function scoreSchemes(schemes: Scheme[], entities: UserEntities): ScoredScheme[] {
  const isEducation = !!(
    entities.purpose?.toLowerCase().includes('education') ||
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

      const { score: iScore, warning: iWarn } = incomeScore(scheme, entities.family_income_rs);
      score += iScore;
      if (iWarn) warnings.push(iWarn);
      else if (entities.family_income_rs) matchReasons.push('Income falls within eligible threshold');

      const { score: lScore, warning: lWarn } = loanAmountScore(scheme, entities.loan_amount_rs);
      score += lScore;
      if (lWarn) warnings.push(lWarn);
      else if (entities.loan_amount_rs) matchReasons.push('Loan requirement fits within scheme limits');

      const eScore = educationScore(scheme, isEducation);
      score += eScore;
      if (isEducation && eScore > 0) matchReasons.push('Designed for education/vocational financing');

      const { score: gScore, warning: gWarn } = genderScore(scheme, entities.gender);
      score += gScore;
      if (gWarn) warnings.push(gWarn);
      else if (entities.gender === 'female' && gScore > 0) matchReasons.push('Exclusive concessional scheme for women entrepreneurs');

      // Prefer lower interest rates slightly
      score += Math.max(0, (10 - Number(scheme.interest_rate_min || 6)) * 2);

      return { ...scheme, score, matchReasons, warnings };
    })
    .filter((s) => s.score > -30)
    .sort((a, b) => b.score - a.score);

  return scored;
}

export async function recommendSchemes(entities: UserEntities, categoryHint?: string): Promise<ScoredScheme[]> {
  const all = await fetchActiveSchemes(categoryHint);
  const scored = scoreSchemes(all, entities);
  if (scored.length === 0) {
    return all.slice(0, 3).map((s) => ({ ...s, score: 50, matchReasons: ['Official NSFDC Concessional Scheme'], warnings: [] }));
  }
  return scored.slice(0, 3);
}
