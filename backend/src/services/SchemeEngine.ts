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
  if (!purpose) return 5; // neutral — no info
  const p = purpose.toLowerCase();
  const types = (scheme.eligible_project_types || []).map((t) => t.toLowerCase());

  if (types.some((t) => p.includes(t) || t.includes(p))) return 30;

  // Semantic groups
  const businessWords = ['tailoring', 'shop', 'dairy', 'grocery', 'kirana', 'trade', 'enterprise', 'business', 'handicraft', 'weaving'];
  const agriWords = ['agriculture', 'farming', 'poultry', 'animal', 'cattle'];
  if (businessWords.some((w) => p.includes(w)) && types.some((t) => businessWords.some((w) => t.includes(w)))) return 25;
  if (agriWords.some((w) => p.includes(w)) && types.some((t) => agriWords.some((w) => t.includes(w)))) return 25;

  return 0;
}

function incomeScore(scheme: Scheme, incomeRs: number | undefined): { score: number; warning?: string } {
  if (!incomeRs) return { score: 10 }; // no info — give benefit of doubt
  const incomeLakh = incomeRs / 100000;

  if (incomeLakh > scheme.max_income_lakh) {
    return {
      score: -50,
      warning: `Your income (₹${(incomeLakh).toFixed(1)}L) exceeds the limit (₹${scheme.max_income_lakh}L) for this scheme`,
    };
  }
  if (scheme.min_income_lakh && incomeLakh < scheme.min_income_lakh) {
    return {
      score: -20,
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
      score: 0,
      warning: `Your required amount (₹${amountLakh.toFixed(1)}L) exceeds this scheme's limit (₹${scheme.max_loan_lakh}L)`,
    };
  }
  if (scheme.min_loan_lakh && amountLakh < scheme.min_loan_lakh) {
    return { score: 5, warning: `Your requirement is below the minimum loan for this scheme` };
  }
  return { score: 20 };
}

function educationScore(scheme: Scheme, isEducation: boolean): number {
  if (isEducation && scheme.education_required) return 15;
  if (isEducation && !scheme.education_required) return -10;
  if (!isEducation && scheme.education_required) return -30;
  return 5;
}

function genderScore(scheme: Scheme, gender: string | undefined): { score: number; warning?: string } {
  if (!gender) return { score: 0 };
  if (scheme.gender_eligibility === 'women_only' && gender !== 'female') {
    return { score: -100, warning: 'This scheme is exclusively for women applicants' };
  }
  if (scheme.gender_eligibility === 'women_only' && gender === 'female') {
    return { score: 10 };
  }
  return { score: 0 };
}

export function scoreSchemes(schemes: Scheme[], entities: UserEntities): ScoredScheme[] {
  const isEducation = !!(
    entities.purpose?.toLowerCase().includes('education') ||
    entities.education_level ||
    entities.course
  );

  return schemes
    .map((scheme): ScoredScheme => {
      let score = 0;
      const matchReasons: string[] = [];
      const warnings: string[] = [];

      const pScore = purposeMatchScore(scheme, entities.purpose);
      score += pScore;
      if (pScore >= 25) matchReasons.push('Your purpose matches this scheme\'s eligible activities');

      const { score: iScore, warning: iWarn } = incomeScore(scheme, entities.family_income_rs);
      score += iScore;
      if (iWarn) warnings.push(iWarn);
      else if (entities.family_income_rs) matchReasons.push('Your income falls within eligibility range');

      const { score: lScore, warning: lWarn } = loanAmountScore(scheme, entities.loan_amount_rs);
      score += lScore;
      if (lWarn) warnings.push(lWarn);
      else if (entities.loan_amount_rs) matchReasons.push('Your loan requirement fits within scheme limits');

      const eScore = educationScore(scheme, isEducation);
      score += eScore;
      if (isEducation && eScore > 0) matchReasons.push('Designed for education/vocational financing');

      const { score: gScore, warning: gWarn } = genderScore(scheme, entities.gender);
      score += gScore;
      if (gWarn) warnings.push(gWarn);

      // Prefer lower interest rates
      score += Math.max(0, (10 - scheme.interest_rate_min) * 2);

      return { ...scheme, score, matchReasons, warnings };
    })
    .filter((s) => s.score > -30)
    .sort((a, b) => b.score - a.score);
}

export async function recommendSchemes(entities: UserEntities, categoryHint?: string): Promise<ScoredScheme[]> {
  const all = await fetchActiveSchemes(categoryHint);
  const scored = scoreSchemes(all, entities);
  return scored.slice(0, 3);
}
