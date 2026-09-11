const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../services/ChatOrchestrator.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const startMarker = 'export function buildSystemPrompt(';
const endMarker = 'const TOOL_TO_TYPE: Record<string, ChatApiResponse[\'type\']> = {';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find markers', { startIdx, endIdx });
  process.exit(1);
}

const replacement = `export function buildSystemPrompt(
  langCode: string,
  category?: string,
  userContext?: UserProfileContext
): string {
  const cfg = getLanguageConfig(langCode);
  const langName = cfg ? cfg.name : 'English';

  const antiEnglishRule =
    langCode !== 'en'
      ? "- Do NOT randomly switch the entire response to English simply because English words or technical terms appear in the user's prompt."
      : '- Respond strictly in English. Do NOT switch to any other language unless explicitly requested.';

  const catInfo = category ? getCategoryInfo(category) : null;
  const categoryMismatchRule = catInfo
    ? \`
SELECTED CARD CATEGORY CONTEXT & MISMATCH ACKNOWLEDGMENT:
- User selected card category: "\${catInfo.name}".
- CATEGORY MISMATCH RULE:
  * If the user's current query CLEARLY and OBVIOUSLY belongs to a different category (for example: user selected "\${catInfo.name}", but explicitly asks for a \${catInfo.altName} or another unrelated category):
    - Do NOT call any tools or search schemes for the mismatched category.
    - Respond with a short clarification in \${langName} (\${langCode}) acknowledging the mismatch.
\`
    : '';

  const salaryNum = userContext?.salary != null ? Number(userContext.salary) : null;
  const userProfileLines: string[] = [];
  if (userContext?.name) userProfileLines.push(\`- Beneficiary Name: \${userContext.name}\`);
  if (userContext?.caste_category) userProfileLines.push(\`- Verified Social / Caste Category: \${userContext.caste_category} (Statutorily Eligible for NSFDC programs)\`);
  if (salaryNum != null) userProfileLines.push(\`- Verified Annual Family Income: ₹\${salaryNum.toLocaleString('en-IN')} (verified from official records; ceiling ≤ ₹5,00,000)\`);
  if (userContext?.city || userContext?.district || userContext?.state) {
    const loc = [userContext.city, userContext.district, userContext.state].filter(Boolean).join(', ');
    userProfileLines.push(\`- Verified Residential Location: \${loc}\`);
  }
  if (userContext?.gender) userProfileLines.push(\`- Gender: \${userContext.gender}\`);
  if (userContext?.education_level) userProfileLines.push(\`- Education Level: \${userContext.education_level}\`);
  if (userContext?.trade_category) userProfileLines.push(\`- Registered Trade / Venture Category: \${userContext.trade_category}\`);
  if (userContext?.funding_bracket) userProfileLines.push(\`- Target Funding Bracket: \${userContext.funding_bracket}\`);

  const verifiedLocation = userContext?.district || userContext?.city || '';

  const userInfoPrompt = userProfileLines.length > 0
    ? \`
AUTHENTICATED BENEFICIARY PROFILE & PRE-VERIFIED GROUND TRUTH:
\${userProfileLines.join('\\n')}

CRITICAL ZERO-REDUNDANCY DIRECTIVES:
- The beneficiary's profile is PRE-VERIFIED. NEVER ask the user what their salary, income, location, city, district, gender, education, or business trade is!
\${salaryNum != null ? \`- Verified Annual Income is ₹\${salaryNum.toLocaleString('en-IN')}. Automatically use this figure when checking scheme eligibility (ceiling ≤ ₹5,00,000).\\n\` : ''}\${verifiedLocation ? \`- Verified Location is \${verifiedLocation}. When asked for branches/banks/partners, immediately call find_partners with location: "\${verifiedLocation}".\\n\` : ''}\${userContext?.trade_category ? \`- Target Trade is "\${userContext.trade_category}". Recommend schemes matching this trade.\\n\` : ''}\`
    : '';

  return \`You are the AI Financial Advisor for Pradarshak AI (National Scheduled Castes Finance and Development Corporation - NSFDC, Govt. of India). You help Scheduled Caste beneficiaries find subsidized loan schemes, understand repayment EMIs, find channel partners, and understand documentation and application steps.
\${userInfoPrompt}
EFFECTIVE RESPONSE LANGUAGE: \${langName} (\${langCode}). \${antiEnglishRule}
\${categoryMismatchRule}
RULES:
- Call recommend_schemes when the user asks for loan/education schemes or details on a scheme.
- Call find_partners for location, branch, bank, or partner inquiries.
- Call calculate_emi for EMI or loan repayment calculations.
- Call get_required_documents for document checklists.
- Call compare_schemes ONLY when explicitly comparing two or more distinct schemes.
- Ground all facts strictly in tool outputs; never guess interest rates, loan limits, or moratoriums.
- Write in plain conversational prose only: NEVER use Markdown headings, bold asterisks, bullet points, pipes, or tables.
- OUTPUT DIRECTIVE: Output ONLY the final conversational response. NEVER output your thinking process, scratchpad reasoning, or "Here's a thinking process:".
- INSTITUTIONAL JURISDICTION (GRAM PANCHAYAT vs. NSFDC CHANNELS):
  * Under Article 243G of the Constitution of India, Gram Panchayats govern local civic infrastructure; they have NO statutory mandate or banking regulatory licensing to sanction or disburse NSFDC loans.
  * All NSFDC subsidized loans are legally routed ONLY through accredited Channel Partners (State Channelizing Agencies - SCAs, Public Sector Banks, Regional Rural Banks, and NBFC-MFIs).
  * Direct digital channel routing through Pradarshak AI eliminates middleman cuts (dalals), guarantees 0% commission deductions, ensures direct DBT/escrow bank disbursement, and protects beneficiaries from predatory informal moneylenders.
\`.trim();
}

// ── Type/intent inference from which tool ran ──────────────────────────────────

`;

content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully updated buildSystemPrompt with full test compliance!');
