const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../services/ChatOrchestrator.ts');
let content = fs.readFileSync(targetFile, 'utf8');

const target = `  if (session.lastContext) {
    messages.push({
      role: 'system',
      content: \`Known context from earlier in this conversation (already real, verified data — you may reference it without re-calling a tool): \${JSON.stringify(session.lastContext)}\`,
    });
  }

  for (const turn of session.conversationHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }`;

const replacement = `  if (session.lastContext) {
    const compactCtx: Record<string, unknown> = {};
    if (session.lastContext.recommend_schemes?.schemes) {
      compactCtx.recentSchemes = (session.lastContext.recommend_schemes.schemes as Scheme[])
        .slice(0, 2)
        .map((s) => ({ name: s.name, code: s.code, category: s.category, maxLoanLakh: s.max_loan_lakh }));
    }
    if (session.lastContext.selectedScheme) {
      const s = session.lastContext.selectedScheme;
      compactCtx.selectedScheme = { name: s.name, code: s.code, maxLoanLakh: s.max_loan_lakh };
    }
    if (Object.keys(compactCtx).length > 0) {
      messages.push({
        role: 'system',
        content: \`Known context from earlier in this conversation: \${JSON.stringify(compactCtx)}\`,
      });
    }
  }

  // Bounded conversation history (last 4 turns to avoid prompt token explosion & credit 402s)
  const recentHistory = session.conversationHistory.slice(-4);
  for (const turn of recentHistory) {
    messages.push({ role: turn.role, content: turn.content });
  }`;

const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedTarget = target.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedTarget)) {
  const updated = normalizedContent.replace(normalizedTarget, replacement);
  fs.writeFileSync(targetFile, updated, 'utf8');
  console.log('Successfully bounded conversation history and compacted lastContext!');
} else {
  console.error('Target not found!');
  process.exit(1);
}
