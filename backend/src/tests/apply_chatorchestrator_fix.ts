import fs from 'fs';
import path from 'path';

const filePath = path.resolve(__dirname, '../services/ChatOrchestrator.ts');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. buildSystemPrompt signature
content = content.replace(
  `export function buildSystemPrompt(
  langCode: string,
  category?: string,
  userContext?: UserProfileContext
): string {`,
  `export function buildSystemPrompt(
  langCode: string,
  category?: string,
  userContext?: UserProfileContext,
  knownFacts?: ConversationFacts
): string {`
);

// 2. buildSystemPrompt body
const oldTarget = `  const userInfoPrompt = userProfileLines.length > 0
    ? \`
AUTHENTICATED BENEFICIARY PROFILE & PRE-VERIFIED GROUND TRUTH:
\${userProfileLines.join('\\n')}

CRITICAL ZERO-REDUNDANCY DIRECTIVES:
- The beneficiary's profile is PRE-VERIFIED. NEVER ask the user what their salary, income, location, city, district, gender, education, or business trade is!
\${salaryNum != null ? \`- Verified Annual Income is ₹\${salaryNum.toLocaleString('en-IN')}. Automatically use this figure when checking scheme eligibility (ceiling ≤ ₹5,00,000) or evaluating repayment capacity.\` : ''}
\${verifiedLocation ? \`- Verified Location is \${verifiedLocation}. When the user asks "Where is the nearest branch?", "find partners", or "where to apply", NEVER prompt for their city/location — IMMEDIATELY call find_partners with location: "\${verifiedLocation}".\` : ''}
\${userContext?.trade_category ? \`- Target Trade is "\${userContext.trade_category}". Automatically recommend schemes matching this trade.\` : ''}
\`
    : '';

  return \`
You are the AI Financial Advisor for Pradarshak AI`;

const newTarget = `  const userInfoPrompt = userProfileLines.length > 0
    ? \`
AUTHENTICATED BENEFICIARY PROFILE & PRE-VERIFIED GROUND TRUTH:
\${userProfileLines.join('\\n')}

CRITICAL ZERO-REDUNDANCY DIRECTIVES:
- The beneficiary's profile is PRE-VERIFIED. NEVER ask the user what their salary, income, location, city, district, gender, education, or business trade is!
\${salaryNum != null ? \`- Verified Annual Income is ₹\${salaryNum.toLocaleString('en-IN')}. Automatically use this figure when checking scheme eligibility (ceiling ≤ ₹5,00,000) or evaluating repayment capacity.\` : ''}
\${verifiedLocation ? \`- Verified Location is \${verifiedLocation}. When the user asks "Where is the nearest branch?", "find partners", or "where to apply", NEVER prompt for their city/location — IMMEDIATELY call find_partners with location: "\${verifiedLocation}".\` : ''}
\${userContext?.trade_category ? \`- Target Trade is "\${userContext.trade_category}". Automatically recommend schemes matching this trade.\` : ''}
\`
    : '';

  const factLines: string[] = [];
  if (knownFacts) {
    if (knownFacts.business_type) factLines.push(\`- Stated Business / Trade: \${knownFacts.business_type}\`);
    if (knownFacts.purpose) factLines.push(\`- Stated Purpose / Equipment: \${knownFacts.purpose}\`);
    if (knownFacts.loan_amount_rs != null) {
      factLines.push(\`- Stated Loan Requirement: ₹\${(knownFacts.loan_amount_rs / 100000).toFixed(1)} Lakh (₹\${knownFacts.loan_amount_rs.toLocaleString('en-IN')}) [\${knownFacts.loan_amount_type || 'approximate'}]\`);
    }
    if (knownFacts.family_income_rs != null) {
      factLines.push(\`- Stated Annual Family Income: ₹\${knownFacts.family_income_rs.toLocaleString('en-IN')}\`);
    }
    if (knownFacts.location) factLines.push(\`- Stated Location: \${knownFacts.location}\`);
    if (knownFacts.last_recommended_schemes && knownFacts.last_recommended_schemes.length > 0) {
      factLines.push(\`- Previously Presented Schemes: \${knownFacts.last_recommended_schemes.map((s) => s.name).join(', ')}\`);
    }
  }

  const knownFactsPrompt = factLines.length > 0
    ? \`
STRUCTURED CONVERSATION CONTEXT & KNOWN BENEFICIARY FACTS (DO NOT RE-ASK):
\${factLines.join('\\n')}

CONVERSATIONAL INTEGRITY & ZERO-REDUNDANCY MANDATE:
- DO NOT re-ask the user for any information that is already present in the KNOWN FACTS or pre-verified profile above!
- Specifically:
  * If the loan amount is already known (e.g. ₹1 Lakh), NEVER ask "What loan amount do you need?" or "Could you share your required loan amount?".
  * If the business type is already known (e.g. tailoring), NEVER ask "What business are you planning?".
  * NEVER ask about an "intended course" or "degree" unless the user's inquiry is explicitly an education loan. For a tailoring business, discuss machines, shop setup, and working capital, NEVER courses.
- FINANCING ESTIMATION INQUIRIES:
  * If the user asks "how much money do I need actually" or asks for an estimate for their tailoring business, explain that ₹1 Lakh is a realistic starting estimate covering an industrial sewing machine, shop security/furnishing, and fabric working capital.
  * Highlight that Micro Credit Finance (MCF) supports small projects up to ₹1.40 Lakh at 6.5% interest, making it an ideal match.
- STANDARDIZED POST-RECOMMENDATION CTA:
  * Whenever you present or recommend schemes to the user, conclude your response with this exact offer:
    "\${POST_RECOMMENDATION_CTA[langCode] || POST_RECOMMENDATION_CTA.en}"
  * This offer MUST appear strictly AFTER the scheme recommendations, never before them.
\`
    : '';

  return \`
You are the AI Financial Advisor for Pradarshak AI (National Scheduled Castes Finance and Development Corporation - NSFDC, Govt. of India). You help Scheduled Caste beneficiaries find subsidized loan schemes, understand repayment EMIs, find channel partners, and understand documentation and application steps.
\${userInfoPrompt}
\${knownFactsPrompt}`;

if (!content.includes('knownFactsPrompt')) {
  content = content.replace(oldTarget, newTarget);
}

// 3. Update process() start
const oldProcess = `  session.conversationHistory.push({ role: 'user', content: message });

  const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(session.language, category, effectiveUserContext) }];

  if (session.lastContext) {
    messages.push({
      role: 'system',
      content: \`Known context from earlier in this conversation (already real, verified data — you may reference it without re-calling a tool): \${JSON.stringify(session.lastContext)}\`,
    });
  }

  for (const turn of session.conversationHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }`;

const newProcess = `  // 1. Extract and update structured persistent facts
  session.knownFacts = extractAndUpdateFacts(session.knownFacts || {}, message, effectiveUserContext);

  session.conversationHistory.push({ role: 'user', content: message });

  const messages: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt(session.language, category, effectiveUserContext, session.knownFacts) },
  ];

  if (session.lastContext) {
    messages.push({
      role: 'system',
      content: \`Known context from earlier in this conversation (already real, verified data — you may reference it without re-calling a tool): \${JSON.stringify(session.lastContext)}\`,
    });
  }

  // Active recommended schemes from earlier in this conversation for pronoun & reference resolution
  if (session.knownFacts?.last_recommended_schemes && session.knownFacts.last_recommended_schemes.length > 0) {
    const listStr = session.knownFacts.last_recommended_schemes
      .map((s, idx) => \`[\${idx + 1}] \${s.name} (Max Loan: ₹\${s.max_loan_lakh}L)\`)
      .join(', ');
    messages.push({
      role: 'system',
      content: \`CURRENT ACTIVE RECOMMENDED SCHEMES IN THIS CONVERSATION: \${listStr}. When the user says "the first one", "first scheme", "that scheme", or "this loan", refer directly to these.\`,
    });
  }

  // Bound conversation history to last 10 turns to avoid token inflation
  const historySlice = session.conversationHistory.slice(-10);
  for (const turn of historySlice) {
    messages.push({ role: turn.role, content: turn.content });
  }`;

if (!content.includes('CURRENT ACTIVE RECOMMENDED SCHEMES')) {
  content = content.replace(oldProcess, newProcess);
}

// 4. Update tool arguments and caching
const oldTool = `              // Pre-populate missing tool arguments from verified user profile
              if (call.function.name === 'recommend_schemes') {
                if (args.family_income_rs == null && effectiveUserContext?.salary != null) {
                  args.family_income_rs = Number(effectiveUserContext.salary);
                }
                if (!args.location && (effectiveUserContext?.district || effectiveUserContext?.city)) {
                  args.location = effectiveUserContext.district || effectiveUserContext.city;
                }
                if (!args.gender && effectiveUserContext?.gender) {
                  args.gender = effectiveUserContext.gender.toLowerCase();
                }
                if (!args.education_level && effectiveUserContext?.education_level) {
                  args.education_level = effectiveUserContext.education_level;
                }
                if (!args.purpose && effectiveUserContext?.trade_category) {
                  args.purpose = effectiveUserContext.trade_category;
                }
              } else if (call.function.name === 'find_partners') {
                if (!args.location && (effectiveUserContext?.district || effectiveUserContext?.city)) {
                  args.location = effectiveUserContext.district || effectiveUserContext.city;
                }
              }

              const result = await executeTool(call.function.name, args);
              lastToolName = result.toolName;
              lastToolData = result.data;`;

const newTool = `              // Pre-populate missing or enrich tool arguments from verified profile & known conversation facts
              if (call.function.name === 'recommend_schemes') {
                if (!args.purpose) {
                  args.purpose = session.knownFacts?.purpose || session.knownFacts?.business_type || effectiveUserContext?.trade_category;
                } else if (session.knownFacts?.business_type && !String(args.purpose).toLowerCase().includes(session.knownFacts.business_type.toLowerCase())) {
                  args.purpose = \`\${session.knownFacts.business_type} - \${args.purpose}\`;
                }

                if (!args.query) {
                  args.query = session.knownFacts?.business_type || message;
                } else if (session.knownFacts?.business_type && !String(args.query).toLowerCase().includes(session.knownFacts.business_type.toLowerCase())) {
                  args.query = \`\${session.knownFacts.business_type} \${args.query}\`;
                }

                if (args.loan_amount_rs == null && session.knownFacts?.loan_amount_rs != null) {
                  args.loan_amount_rs = session.knownFacts.loan_amount_rs;
                }

                if (args.family_income_rs == null) {
                  if (session.knownFacts?.family_income_rs != null) {
                    args.family_income_rs = session.knownFacts.family_income_rs;
                  } else if (effectiveUserContext?.salary != null) {
                    args.family_income_rs = Number(effectiveUserContext.salary);
                  }
                }

                if (!args.location) {
                  args.location = session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city;
                }

                if (!args.gender && effectiveUserContext?.gender) {
                  args.gender = effectiveUserContext.gender.toLowerCase();
                }

                if (!args.education_level && (session.knownFacts?.education_level || effectiveUserContext?.education_level)) {
                  args.education_level = session.knownFacts?.education_level || effectiveUserContext?.education_level;
                }

                if (!args.category_hint) {
                  if (session.knownFacts?.business_type) {
                    args.category_hint = 'business_loan';
                  } else if (session.knownFacts?.education_level) {
                    args.category_hint = 'education_loan';
                  }
                }
              } else if (call.function.name === 'find_partners') {
                if (!args.location && (session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city)) {
                  args.location = session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city;
                }
              } else if (call.function.name === 'calculate_emi') {
                if (args.loan_amount_rs == null && session.knownFacts?.loan_amount_rs != null) {
                  args.loan_amount_rs = session.knownFacts.loan_amount_rs;
                }
                if (!args.scheme_name && !args.scheme_id && session.knownFacts?.last_recommended_schemes?.length) {
                  args.scheme_name = session.knownFacts.last_recommended_schemes[0].name;
                  args.scheme_id = session.knownFacts.last_recommended_schemes[0].id;
                }
              } else if (call.function.name === 'get_required_documents') {
                if (!args.scheme_name && !args.scheme_id && session.knownFacts?.last_recommended_schemes?.length) {
                  args.scheme_name = session.knownFacts.last_recommended_schemes[0].name;
                  args.scheme_id = session.knownFacts.last_recommended_schemes[0].id;
                }
              }

              const result = await executeTool(call.function.name, args);
              lastToolName = result.toolName;
              lastToolData = result.data;

              // Cache top recommended schemes in session knownFacts for pronoun & follow-up resolution
              if (result.toolName === 'recommend_schemes' && Array.isArray(result.data?.schemes)) {
                session.knownFacts.last_recommended_schemes = (result.data.schemes as Scheme[]).slice(0, 5).map((s) => ({
                  id: s.id,
                  name: s.name,
                  category: s.category,
                  max_loan_lakh: s.max_loan_lakh,
                }));
              }`;

if (!content.includes('session.knownFacts.last_recommended_schemes = (result.data.schemes as Scheme[])')) {
  content = content.replace(oldTool, newTool);
}

// 5. Update fallback
const oldFallback = `      } catch (llmErr) {
        console.warn('[ChatOrchestrator] LLM call fallback triggered:', (llmErr as Error)?.message);
        const fallbackResult = await executeTool('recommend_schemes', { query: message });
        lastToolName = fallbackResult.toolName;
        lastToolData = fallbackResult.data;`;

const newFallback = `      } catch (llmErr) {
        console.warn('[ChatOrchestrator] LLM call fallback triggered:', (llmErr as Error)?.message);
        const fallbackResult = await executeTool('recommend_schemes', {
          query: session.knownFacts?.business_type || message,
          loan_amount_rs: session.knownFacts?.loan_amount_rs,
          purpose: session.knownFacts?.purpose || session.knownFacts?.business_type,
          family_income_rs: session.knownFacts?.family_income_rs || (effectiveUserContext?.salary ? Number(effectiveUserContext.salary) : undefined),
          location: session.knownFacts?.location || effectiveUserContext?.district || effectiveUserContext?.city,
          category_hint: session.knownFacts?.business_type ? 'business_loan' : undefined,
        });
        lastToolName = fallbackResult.toolName;
        lastToolData = fallbackResult.data;`;

if (!content.includes('purpose: session.knownFacts?.purpose')) {
  content = content.replace(oldFallback, newFallback);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating ChatOrchestrator.ts (normalized)');
