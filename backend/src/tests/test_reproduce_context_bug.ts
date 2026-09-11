async function runReproduction() {
  const sessionId = 'test_session_' + Date.now();
  const userContext = {
    id: 'usr_aryan',
    name: 'Aryan Phanse',
    category: 'SC',
    salary: 189525,
    location: 'Pune',
    district: 'Pune',
    city: 'Pune',
    gender: 'Male',
  };

  const turns = [
    "Hi, can you suggest me some good schemes for opening my own tailoring business?",
    "So you already know what my income is and my approximate loan amount would be just 1 lakh or in how much ever I can get a tailoring machine and a little shop in my city. So tell me how much money I need actually.",
    "Uh, my loan amount would be around ₹1 lakh."
  ];

  for (let i = 0; i < turns.length; i++) {
    const msg = turns[i];
    console.log(`\n======================================================`);
    console.log(`TURN ${i + 1} USER: "${msg}"`);
    console.log(`======================================================`);

    const res = await fetch('http://localhost:4000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: msg,
        sessionId,
        language: 'en',
        userContext,
      })
    });

    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Type: ${data.type}`);
    console.log(`Intent: ${data.intent}`);
    console.log(`AI Message:\n${data.message}`);
    const schemes = data.data?.schemes || [];
    if (schemes.length > 0) {
      console.log(`Schemes attached (${schemes.length}):`);
      schemes.forEach((s: any) => console.log(`  - [${s.code || s.name}] ${s.name} (Max: ₹${s.max_loan_lakh}L, Rate: ${s.interest_rate_min}%-${s.interest_rate_max}%)`));
    } else {
      console.log('No scheme cards attached.');
    }
  }
}

runReproduction().catch(console.error);
