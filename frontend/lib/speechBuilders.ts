/**
 * Utility functions to generate clean, speech-friendly text for AI responses.
 * Ensures natural narration without raw markdown, HTML, UI labels, or icon names.
 * Supports multilingual speech text in Marathi (mr), Hindi (hi), Bengali (bn), and English (en).
 */

import { getLocalizedSchemeName, getLocalizedSchemeDesc, getLocalizedDocumentItem } from './translations';

export function buildSchemeSpeech(s: any, lang: string = 'en'): string {
  if (!s) return '';
  const schemeName = getLocalizedSchemeName(s.name, lang) || s.name || '';
  const parts: string[] = [];

  const maxLoan = s.max_loan_lakh != null && !isNaN(Number(s.max_loan_lakh)) ? Number(s.max_loan_lakh) : null;
  const rateMin = s.interest_rate_min;
  const rateMax = s.interest_rate_max;
  const rateStr = rateMin != null && rateMax != null
    ? (rateMin === rateMax ? `${rateMin}` : `${rateMin} ते ${rateMax}`)
    : '';
  const tenure = s.max_tenure_months;
  const morMin = s.moratorium_months_min;
  const morMax = s.moratorium_months_max;
  const desc = getLocalizedSchemeDesc(s.name, s.description || '', lang);

  if (lang === 'mr') {
    if (schemeName) parts.push(`${schemeName}.`);
    if (s.score != null) parts.push(`पात्रता जुळणी: ${Math.round(Number(s.score))} टक्के.`);
    if (maxLoan != null) {
      const loanStr = maxLoan >= 1 ? `${maxLoan} लाख रुपये` : `${Math.round(maxLoan * 100000)} रुपये`;
      parts.push(`कमाल कर्ज मर्यादा: ${loanStr}.`);
    }
    if (rateStr) {
      parts.push(`सवलतीचा व्याज दर: दरसाल ${rateMin === rateMax ? rateMin : `${rateMin} ते ${rateMax}`} टक्के.`);
    }
    if (s.max_income_lakh != null) {
      parts.push(`वार्षिक कौटुंबिक उत्पन्न मर्यादा: कमाल ${s.max_income_lakh} लाख रुपये.`);
    }
    if (desc) parts.push(desc.replace(/[#*`_\[\]]/g, '').trim());
    if (tenure) parts.push(`परतफेड मुदत: कमाल ${tenure} महिने.`);
    if (morMin != null && morMax != null) {
      const morStr = morMin === morMax ? `${morMin} महिने` : `${morMin} ते ${morMax} महिने`;
      parts.push(`मोरेटोरियम सवलत कालावधी: ${morStr}.`);
    }
    return parts.join(' ');
  }

  if (lang === 'hi') {
    if (schemeName) parts.push(`${schemeName}.`);
    if (s.score != null) parts.push(`पात्रता मिलान: ${Math.round(Number(s.score))} प्रतिशत.`);
    if (maxLoan != null) {
      const loanStr = maxLoan >= 1 ? `${maxLoan} लाख रुपये` : `${Math.round(maxLoan * 100000)} रुपये`;
      parts.push(`अधिकतम ऋण सीमा: ${loanStr}.`);
    }
    if (rateStr) {
      parts.push(`रियायती ब्याज दर: वार्षिक ${rateMin === rateMax ? rateMin : `${rateMin} से ${rateMax}`} प्रतिशत.`);
    }
    if (s.max_income_lakh != null) {
      parts.push(`वार्षिक पारिवारिक आय सीमा: अधिकतम ${s.max_income_lakh} लाख रुपये.`);
    }
    if (desc) parts.push(desc.replace(/[#*`_\[\]]/g, '').trim());
    if (tenure) parts.push(`पुनर्भुगतान अवधि: अधिकतम ${tenure} महीने.`);
    if (morMin != null && morMax != null) {
      const morStr = morMin === morMax ? `${morMin} महीने` : `${morMin} से ${morMax} महीने`;
      parts.push(`मोरेटोरियम छूट अवधि: ${morStr}.`);
    }
    return parts.join(' ');
  }

  if (lang === 'bn') {
    if (schemeName) parts.push(`${schemeName}।`);
    if (s.score != null) parts.push(`যোগ্যতার মিল: ${Math.round(Number(s.score))} শতাংশ।`);
    if (maxLoan != null) {
      const loanStr = maxLoan >= 1 ? `${maxLoan} লাখ টাকা` : `${Math.round(maxLoan * 100000)} টাকা`;
      parts.push(`সর্বোচ্চ ঋণের পরিমাণ: ${loanStr}।`);
    }
    if (rateStr) {
      parts.push(`সুদের হার: বার্ষিক ${rateMin === rateMax ? rateMin : `${rateMin} থেকে ${rateMax}`} শতাংশ।`);
    }
    if (s.max_income_lakh != null) {
      parts.push(`পারিবারিক আয়ের সর্বোচ্চ সীমা: ${s.max_income_lakh} লাখ টাকা।`);
    }
    if (desc) parts.push(desc.replace(/[#*`_\[\]]/g, '').trim());
    if (tenure) parts.push(`পরিশোধের মেয়াদ: সর্বোচ্চ ${tenure} মাস।`);
    if (morMin != null && morMax != null) {
      const morStr = morMin === morMax ? `${morMin} মাস` : `${morMin} থেকে ${morMax} মাস`;
      parts.push(`গ্রেস পিরিয়ড: ${morStr}।`);
    }
    return parts.join(' ');
  }

  // English fallback
  if (s.name) {
    parts.push(`${s.name}.`);
  }
  if (s.score != null) {
    parts.push(`Match score: ${Math.round(Number(s.score))} percent.`);
  }
  if (maxLoan != null) {
    const loanStr = maxLoan >= 1 ? `${maxLoan} lakh rupees` : `${Math.round(maxLoan * 100000)} rupees`;
    parts.push(`Maximum loan: ${loanStr}.`);
  }
  if (rateMin != null && rateMax != null) {
    const rateEnglish = rateMin === rateMax ? `${rateMin} percent per annum` : `${rateMin} to ${rateMax} percent per annum`;
    parts.push(`Interest rate: ${rateEnglish}.`);
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
  if (morMin != null && morMax != null) {
    const morStr = morMin === morMax ? `${morMin} months` : `${morMin} to ${morMax} months`;
    parts.push(`Moratorium grace period: ${morStr}.`);
  }

  return parts.join(' ');
}

export function buildDocumentsSpeech(
  documents: string[],
  schemeName?: string,
  note?: string,
  lang: string = 'en'
): string {
  const localizedScheme = getLocalizedSchemeName(schemeName, lang) || schemeName;
  const localizedDocs = documents.map((d) => getLocalizedDocumentItem(d, lang));
  const parts: string[] = [];

  if (lang === 'mr') {
    if (localizedScheme) {
      parts.push(`${localizedScheme} साठी आवश्यक कागदपत्रे.`);
    } else {
      parts.push('आवश्यक कागदपत्रांची पडताळणी सूची.');
    }
    if (localizedDocs.length > 0) {
      parts.push(`आवश्यक कागदपत्रांमध्ये समाविष्ट आहेत: ${localizedDocs.join(', ')}.`);
    }
    if (note) {
      parts.push(note.replace(/[#*`_\[\]]/g, '').trim());
    }
    return parts.join(' ');
  }

  if (lang === 'hi') {
    if (localizedScheme) {
      parts.push(`${localizedScheme} के लिए आवश्यक दस्तावेज।`);
    } else {
      parts.push('आवश्यक दस्तावेज चेकलिस्ट।');
    }
    if (localizedDocs.length > 0) {
      parts.push(`आवश्यक दस्तावेजों में शामिल हैं: ${localizedDocs.join(', ')}।`);
    }
    if (note) {
      parts.push(note.replace(/[#*`_\[\]]/g, '').trim());
    }
    return parts.join(' ');
  }

  if (lang === 'bn') {
    if (localizedScheme) {
      parts.push(`${localizedScheme}-এর জন্য প্রয়োজনীয় নথি।`);
    } else {
      parts.push('প্রয়োজনীয় নথিপত্রের তালিকা।');
    }
    if (localizedDocs.length > 0) {
      parts.push(`প্রয়োজনীয় নথির মধ্যে রয়েছে: ${localizedDocs.join(', ')}।`);
    }
    if (note) {
      parts.push(note.replace(/[#*`_\[\]]/g, '').trim());
    }
    return parts.join(' ');
  }

  // English fallback
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

export function buildEmiSpeech(data: any, lang: string = 'en'): string {
  if (!data) return '';
  const schemeName = getLocalizedSchemeName(data.schemeName || data.scheme?.name, lang);
  const parts: string[] = [];

  const principal = data.principal ?? data.params?.principal ?? 0;
  const rate = data.interestRatePct ?? data.rate ?? data.params?.rate ?? 0;
  const tenure = data.tenureMonths ?? data.params?.tenureMonths ?? 0;
  const moratorium = data.moratoriumMonths ?? data.params?.moratoriumMonths ?? 0;
  const emi = data.emi ?? 0;
  const totalInterest = data.totalInterest ?? 0;
  const totalPayable = data.totalPayable ?? 0;

  if (lang === 'mr') {
    if (schemeName) {
      parts.push(`${schemeName} साठी ईएमआई अंदाज.`);
    } else {
      parts.push('ईएमआई अंदाज गणना.');
    }
    if (principal > 0) {
      const pStr = principal >= 100000 ? `${(principal / 100000).toFixed(2)} लाख रुपये` : `${principal} रुपये`;
      parts.push(`कर्ज मुद्दल: ${pStr}.`);
    }
    if (rate > 0) parts.push(`व्याज दर: दरसाल ${rate} टक्के.`);
    if (tenure > 0) parts.push(`परतफेड मुदत: ${tenure} महिने.`);
    if (moratorium > 0) parts.push(`मोरेटोरियम सवलत कालावधी: ${moratorium} महिने.`);
    if (emi > 0) parts.push(`अंदाजे मासिक ईएमआई: ${Math.round(emi)} रुपये.`);
    if (totalInterest > 0) parts.push(`एकूण देय व्याज: ${Math.round(totalInterest)} रुपये.`);
    if (totalPayable > 0) parts.push(`एकूण परतफेड रक्कम: ${Math.round(totalPayable)} रुपये.`);
    return parts.join(' ');
  }

  if (lang === 'hi') {
    if (schemeName) {
      parts.push(`${schemeName} के लिए ईएमआई अनुमान।`);
    } else {
      parts.push('ईएमआई गणना अनुमान।');
    }
    if (principal > 0) {
      const pStr = principal >= 100000 ? `${(principal / 100000).toFixed(2)} लाख रुपये` : `${principal} रुपये`;
      parts.push(`ऋण मूलधन: ${pStr}।`);
    }
    if (rate > 0) parts.push(`ब्याज दर: वार्षिक ${rate} प्रतिशत।`);
    if (tenure > 0) parts.push(`पुनर्भुगतान अवधि: ${tenure} महीने।`);
    if (moratorium > 0) parts.push(`मोरेटोरियम छूट अवधि: ${moratorium} महीने।`);
    if (emi > 0) parts.push(`अनुमानित मासिक ईएमआई: ${Math.round(emi)} रुपये।`);
    if (totalInterest > 0) parts.push(`कुल देय ब्याज: ${Math.round(totalInterest)} रुपये।`);
    if (totalPayable > 0) parts.push(`कुल पुनर्भुगतान राशि: ${Math.round(totalPayable)} रुपये।`);
    return parts.join(' ');
  }

  if (lang === 'bn') {
    if (schemeName) {
      parts.push(`${schemeName}-এর জন্য ইএমআই পূর্বাভাস।`);
    } else {
      parts.push('ইএমআই পূর্বাভাসের হিসাব।');
    }
    if (principal > 0) {
      const pStr = principal >= 100000 ? `${(principal / 100000).toFixed(2)} লাখ টাকা` : `${principal} টাকা`;
      parts.push(`মূল ঋণের পরিমাণ: ${pStr}।`);
    }
    if (rate > 0) parts.push(`সুদের হার: বার্ষিক ${rate} শতাংশ।`);
    if (tenure > 0) parts.push(`পরিশোধের মেয়াদ: ${tenure} মাস।`);
    if (moratorium > 0) parts.push(`গ্রেস পিরিয়ড: ${moratorium} মাস।`);
    if (emi > 0) parts.push(`আনুমানিক মাসিক ইএমআই: ${Math.round(emi)} টাকা।`);
    if (totalInterest > 0) parts.push(`মোট প্রদেয় সুদ: ${Math.round(totalInterest)} টাকা।`);
    if (totalPayable > 0) parts.push(`মোট পরিশোধের পরিমাণ: ${Math.round(totalPayable)} টাকা।`);
    return parts.join(' ');
  }

  // English fallback
  if (schemeName) {
    parts.push(`Calculated EMI projection for ${schemeName}.`);
  } else {
    parts.push('Calculated EMI projection.');
  }
  if (principal > 0) {
    const pStr = principal >= 100000 ? `${(principal / 100000).toFixed(2)} lakh rupees` : `${principal} rupees`;
    parts.push(`Loan principal: ${pStr}.`);
  }
  if (rate > 0) {
    parts.push(`Interest rate: ${rate} percent per annum.`);
  }
  if (tenure > 0) {
    parts.push(`Repayment tenure: ${tenure} months.`);
  }
  if (moratorium > 0) {
    parts.push(`Moratorium grace period: ${moratorium} months.`);
  }
  if (emi > 0) {
    parts.push(`Estimated monthly EMI: ${Math.round(emi)} rupees.`);
  }
  if (totalInterest > 0) {
    parts.push(`Total interest payable: ${Math.round(totalInterest)} rupees.`);
  }
  if (totalPayable > 0) {
    parts.push(`Total repayment amount: ${Math.round(totalPayable)} rupees.`);
  }

  return parts.join(' ');
}

export function buildComparisonSpeech(schemes: any[], lang: string = 'en'): string {
  if (!schemes || schemes.length === 0) return '';
  const count = schemes.length;
  const parts: string[] = [];

  if (lang === 'mr') {
    parts.push(`${count} योजनांची सविस्तर तुलना.`);
    for (const s of schemes) {
      const name = getLocalizedSchemeName(s.name, lang) || s.name;
      const loan = s.max_loan_lakh != null ? `${s.max_loan_lakh} लाख रुपये` : 'सवलतीची मर्यादा';
      const rate = s.interest_rate_min === s.interest_rate_max
        ? `दरसाल ${s.interest_rate_min} टक्के`
        : `दरसाल ${s.interest_rate_min} ते ${s.interest_rate_max} टक्के`;
      const tenure = s.max_tenure_months ? `कमाल ${s.max_tenure_months} महिने` : 'लवचिक मुदत';
      parts.push(`${name} मध्ये कमाल कर्ज ${loan}, व्याज दर ${rate} आणि परतफेड मुदत ${tenure} पर्यंत आहे.`);
    }
    return parts.join(' ');
  }

  if (lang === 'hi') {
    parts.push(`${count} योजनाओं की साथ-साथ तुलना।`);
    for (const s of schemes) {
      const name = getLocalizedSchemeName(s.name, lang) || s.name;
      const loan = s.max_loan_lakh != null ? `${s.max_loan_lakh} लाख रुपये` : 'उपलब्ध सीमा';
      const rate = s.interest_rate_min === s.interest_rate_max
        ? `वार्षिक ${s.interest_rate_min} प्रतिशत`
        : `वार्षिक ${s.interest_rate_min} से ${s.interest_rate_max} प्रतिशत`;
      const tenure = s.max_tenure_months ? `अधिकतम ${s.max_tenure_months} महीने` : 'लचीली अवधि';
      parts.push(`${name} में अधिकतम ऋण ${loan}, ब्याज दर ${rate} और पुनर्भुगतान अवधि ${tenure} है।`);
    }
    return parts.join(' ');
  }

  if (lang === 'bn') {
    parts.push(`${count}টি প্রকল্পের পাশাপাশি তুলনা।`);
    for (const s of schemes) {
      const name = getLocalizedSchemeName(s.name, lang) || s.name;
      const loan = s.max_loan_lakh != null ? `${s.max_loan_lakh} লাখ টাকা` : 'উপলব্ধ সীমা';
      const rate = s.interest_rate_min === s.interest_rate_max
        ? `বার্ষিক ${s.interest_rate_min} শতাংশ`
        : `বার্ষিক ${s.interest_rate_min} থেকে ${s.interest_rate_max} শতাংশ`;
      const tenure = s.max_tenure_months ? `সর্বোচ্চ ${s.max_tenure_months} মাস` : 'নমনীয় মেয়াদ';
      parts.push(`${name}-এ সর্বোচ্চ ঋণ ${loan}, সুদের হার ${rate} এবং পরিশোধের মেয়াদ ${tenure}।`);
    }
    return parts.join(' ');
  }

  // English fallback
  parts.push(`Comparing ${schemes.length} schemes side-by-side.`);
  for (const s of schemes) {
    const loan = s.max_loan_lakh != null ? `${s.max_loan_lakh} lakh rupees` : 'concessional limit';
    const rate = s.interest_rate_min === s.interest_rate_max
      ? `${s.interest_rate_min} percent per annum`
      : `${s.interest_rate_min} to ${s.interest_rate_max} percent per annum`;
    const tenure = s.max_tenure_months ? `up to ${s.max_tenure_months} months` : 'flexible tenure';
    parts.push(`${s.name} has a maximum loan of ${loan} with an interest rate of ${rate} and a repayment tenure of ${tenure}.`);
  }

  return parts.join(' ');
}

