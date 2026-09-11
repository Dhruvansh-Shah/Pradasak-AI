async function testChat(query: string) {
  console.log(`\n========================================`);
  console.log(`SENDING QUERY: "${query}"`);
  console.log(`========================================`);
  
  const startTime = Date.now();
  const testSessionId = 'test_edu_' + Date.now();
  const res = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      sessionId: testSessionId,
      language: 'en',
      userContext: {
        id: 'usr_aryan',
        name: 'Aryan Phanse',
        category: 'SC',
        salary: 189525,
        location: 'Pune',
        district: 'Pune',
        city: 'Pune',
        gender: 'Male',
        trade_category: 'Education'
      }
    })
  });

  const duration = Date.now() - startTime;
  console.log(`Status: ${res.status} (${duration}ms)`);
  const data = await res.json();
  console.log(`Response type: ${data.type}`);
  console.log(`Intent: ${data.intent}`);
  console.log(`Message:\n${data.message}`);
  const schemes = data.data?.schemes || [];
  if (schemes.length > 0) {
    console.log(`Schemes returned (${schemes.length}):`);
    schemes.forEach((s: any) => {
      console.log(`- [${s.code || s.name}] ${s.name} | Category: ${s.category} | Max Loan: ₹${s.max_loan_lakh}L | Interest: ${s.interest_rate_min}%-${s.interest_rate_max}%`);
    });
  } else {
    console.log('No scheme cards attached.');
  }

  // Verification assertions
  const msg = data.message || '';
  if (msg.includes("Here's a thinking process") || msg.includes("thinking process:")) {
    console.error('❌ FAILED: Thinking process leaked!');
  } else if (msg.includes("Sorry, could you rephrase that for me?")) {
    console.error('❌ FAILED: Generic rephrase error returned!');
  } else if (schemes.length === 0) {
    console.error('❌ FAILED: No schemes returned for educational inquiry!');
  } else {
    const hasEls = schemes.some((s: any) => s.code === 'ELS' || s.name.includes('Educational Loan'));
    const hasVetls = schemes.some((s: any) => s.code === 'VETLS' || s.name.includes('Vocational'));
    if (hasEls && hasVetls) {
      console.log('✅ SUCCESS: Both ELS and VETLS returned correctly without thinking process or rephrase leak!');
    } else {
      console.log(`⚠️ Schemes found: ${schemes.map((s: any) => s.name).join(', ')}`);
    }
  }
}

async function run() {
  await testChat('suggest me some good educational scheme');
  await testChat('can you suggest some good educational schemes for me');
}

run().catch(console.error);
