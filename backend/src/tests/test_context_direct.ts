import { process as orchestrate } from '../services/ChatOrchestrator';
import { getOrCreate } from '../services/ConversationSession';

async function runDirectContextTest() {
  const sessionId = 'test_ctx_' + Date.now();
  const userContext = {
    name: 'Aryan Phanse',
    salary: 189525,
    location: 'Pune',
    district: 'Pune',
    city: 'Pune',
    gender: 'Male',
    caste_category: 'SC',
  };

  const testTurns = [
    {
      label: 'TURN 1: Initial business inquiry',
      msg: 'Hi, can you suggest me some good schemes for opening my own tailoring business?',
    },
    {
      label: 'TURN 2: Cost estimation inquiry + ₹1L mention',
      msg: 'So you already know what my income is and my approximate loan amount would be just 1 lakh or in how much ever I can get a tailoring machine and a little shop in my city. So tell me how much money I need actually.',
    },
    {
      label: 'TURN 3: Loan amount confirmation',
      msg: 'Uh, my loan amount would be around ₹1 lakh.',
    },
    {
      label: 'TURN 4: Fact correction to ₹1.5L',
      msg: 'Actually, I need ₹1.5 lakh.',
    },
    {
      label: 'TURN 5: Reference to "first one"',
      msg: 'Tell me about the first one.',
    },
    {
      label: 'TURN 6: Follow-up on documents',
      msg: 'What documents do I need?',
    },
  ];

  for (let i = 0; i < testTurns.length; i++) {
    const turn = testTurns[i];
    console.log(`\n======================================================`);
    console.log(`${turn.label}`);
    console.log(`USER: "${turn.msg}"`);
    console.log(`======================================================`);

    const res = await orchestrate(
      turn.msg,
      sessionId,
      'en',
      undefined,
      undefined,
      undefined,
      userContext
    );

    const session = getOrCreate(sessionId);
    console.log(`[Known Facts Snapshot]:`, JSON.stringify(session.knownFacts));
    console.log(`Response Type: ${res.type}`);
    console.log(`Response Intent: ${res.intent}`);
    console.log(`AI Message:\n${res.message}\n`);

    const schemes = (res.data?.schemes as any[]) || [];
    if (schemes.length > 0) {
      console.log(`Schemes attached (${schemes.length}):`);
      schemes.forEach((s) => console.log(`  - [${s.code || s.name}] ${s.name} (Max: ₹${s.max_loan_lakh}L, Rate: ${s.interest_rate_min}%-${s.interest_rate_max}%)`));
    }
  }
}

runDirectContextTest().catch(console.error);
