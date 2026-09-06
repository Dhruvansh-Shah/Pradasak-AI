/**
 * Utility functions to generate clean, speech-friendly text for AI responses.
 * Ensures natural narration without raw markdown, HTML, UI labels, or icon names.
 */

export function buildSchemeSpeech(s: any): string {
  if (!s) return '';
  const parts: string[] = [];

  if (s.name) {
    parts.push(`${s.name}.`);
  }

  if (s.score != null) {
    parts.push(`Match score: ${Math.round(Number(s.score))} percent.`);
  }

  if (s.max_loan_lakh != null && !isNaN(Number(s.max_loan_lakh))) {
    const loan = Number(s.max_loan_lakh);
    const loanStr = loan >= 1 ? `${loan} lakh rupees` : `${Math.round(loan * 100000)} rupees`;
    parts.push(`Maximum loan: ${loanStr}.`);
  }

  if (s.interest_rate_min != null && s.interest_rate_max != null) {
    const rateStr =
      s.interest_rate_min === s.interest_rate_max
        ? `${s.interest_rate_min} percent per annum`
        : `${s.interest_rate_min} to ${s.interest_rate_max} percent per annum`;
    parts.push(`Interest rate: ${rateStr}.`);
  }

  if (s.max_income_lakh != null && !isNaN(Number(s.max_income_lakh))) {
    parts.push(`Annual family income limit: up to ${s.max_income_lakh} lakh rupees.`);
  }

  if (s.description) {
    const cleanDesc = s.description.replace(/[#*`_\[\]]/g, '').trim();
    if (cleanDesc) parts.push(cleanDesc);
  }

  if (s.max_tenure_months) {
    parts.push(`Repayment tenure: up to ${s.max_tenure_months} months.`);
  }

  if (s.moratorium_months_min != null && s.moratorium_months_max != null) {
    const morStr =
      s.moratorium_months_min === s.moratorium_months_max
        ? `${s.moratorium_months_min} months`
        : `${s.moratorium_months_min} to ${s.moratorium_months_max} months`;
    parts.push(`Moratorium grace period: ${morStr}.`);
  }

  return parts.join(' ');
}

export function buildDocumentsSpeech(
  documents: string[],
  schemeName?: string,
  note?: string
): string {
  const parts: string[] = [];

  if (schemeName) {
    parts.push(`Required documents for ${schemeName}.`);
  } else {
    parts.push('Required documentation checklist.');
  }

  if (documents && documents.length > 0) {
    parts.push(`The required documents include: ${documents.join(', ')}.`);
  }

  if (note) {
    const cleanNote = note.replace(/[#*`_\[\]]/g, '').trim();
    if (cleanNote) parts.push(cleanNote);
  }

  return parts.join(' ');
}

export function buildEmiSpeech(data: any): string {
  if (!data) return '';
  const parts: string[] = [];

  const schemeName = data.schemeName || data.scheme?.name;
  if (schemeName) {
    parts.push(`Calculated EMI projection for ${schemeName}.`);
  } else {
    parts.push('Calculated EMI projection.');
  }

  const principal = data.principal ?? data.params?.principal ?? 0;
  if (principal > 0) {
    const pStr =
      principal >= 100000
        ? `${(principal / 100000).toFixed(2)} lakh rupees`
        : `${principal} rupees`;
    parts.push(`Loan principal: ${pStr}.`);
  }

  const rate = data.interestRatePct ?? data.rate ?? data.params?.rate ?? 0;
  if (rate > 0) {
    parts.push(`Interest rate: ${rate} percent per annum.`);
  }

  const tenure = data.tenureMonths ?? data.params?.tenureMonths ?? 0;
  if (tenure > 0) {
    parts.push(`Repayment tenure: ${tenure} months.`);
  }

  const moratorium = data.moratoriumMonths ?? data.params?.moratoriumMonths ?? 0;
  if (moratorium > 0) {
    parts.push(`Moratorium grace period: ${moratorium} months.`);
  }

  const emi = data.emi ?? 0;
  if (emi > 0) {
    parts.push(`Estimated monthly EMI: ${Math.round(emi)} rupees.`);
  }

  const totalInterest = data.totalInterest ?? 0;
  if (totalInterest > 0) {
    parts.push(`Total interest payable: ${Math.round(totalInterest)} rupees.`);
  }

  const totalPayable = data.totalPayable ?? 0;
  if (totalPayable > 0) {
    parts.push(`Total repayment amount: ${Math.round(totalPayable)} rupees.`);
  }

  if (data.warning) {
    const cleanWarn = String(data.warning).replace(/[#*`_\[\]]/g, '').trim();
    if (cleanWarn) parts.push(`Note: ${cleanWarn}.`);
  }

  return parts.join(' ');
}

export function buildComparisonSpeech(schemes: any[]): string {
  if (!schemes || schemes.length === 0) return '';
  const parts: string[] = [`Comparing ${schemes.length} schemes side-by-side.`];

  for (const s of schemes) {
    const loan =
      s.max_loan_lakh != null
        ? `${s.max_loan_lakh} lakh rupees`
        : 'concessional limit';
    const rate =
      s.interest_rate_min === s.interest_rate_max
        ? `${s.interest_rate_min} percent per annum`
        : `${s.interest_rate_min} to ${s.interest_rate_max} percent per annum`;
    const tenure = s.max_tenure_months
      ? `up to ${s.max_tenure_months} months`
      : 'flexible tenure';

    parts.push(
      `${s.name} has a maximum loan of ${loan} with an interest rate of ${rate} and a repayment tenure of ${tenure}.`
    );
  }

  return parts.join(' ');
}
