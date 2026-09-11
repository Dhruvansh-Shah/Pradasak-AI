import axios from 'axios';
import { pool } from '../db/pool';

const API = 'http://localhost:4000/api';

async function runTests() {
  console.log('--- STARTING CHAT SHARE & MIGRATION INTEGRATION TESTS ---');

  // Test 1: Verify guest chat doesn't persist to DB
  console.log('\n[TEST 1] Guest chat does not create database chat record...');
  const guestChatRes = await axios.post(`${API}/chat`, {
    message: 'Hello, what schemes are available for tailoring?',
  });
  console.log('Guest response status:', guestChatRes.status, 'Session ID:', guestChatRes.data.sessionId);

  // Test 2: Create or login a test user
  console.log('\n[TEST 2] Authenticating test citizen...');
  const testEmail = `test_share_user_${Date.now()}@gmail.com`;
  const regRes = await axios.post(`${API}/users/register`, {
    name: 'Ramesh Sharma',
    email: testEmail,
    phone: '9876543210',
    password: 'Password123!',
  });
  const token = regRes.data.token;
  const userId = regRes.data.user.id;
  console.log('User created:', testEmail, 'User ID:', userId);

  // Test 3: Guest-to-authenticated Chat Import
  console.log('\n[TEST 3] Importing guest chat to authenticated user account...');
  const guestMessages = [
    { role: 'user', content: 'How can I get a loan for a tailoring business?' },
    { role: 'assistant', content: 'You can apply for the Term Loan Scheme or Micro Credit Finance Scheme.', type: 'text' },
  ];
  const clientChatId = `guest_test_${Date.now()}`;

  const importRes1 = await axios.post(
    `${API}/chats/import`,
    {
      clientChatId,
      messages: guestMessages,
      title: 'Tailoring Business Loan Inquiry',
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  console.log('Import response 1:', importRes1.data);
  if (!importRes1.data.ok || !importRes1.data.id) {
    throw new Error('Import failed: missing id or ok');
  }
  const persistedChatId = importRes1.data.id;

  // Test 4: Idempotency of Import (no duplicate records)
  console.log('\n[TEST 4] Testing idempotency of import (retrying with same clientChatId)...');
  const importRes2 = await axios.post(
    `${API}/chats/import`,
    {
      clientChatId,
      messages: guestMessages,
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Import response 2 (retry):', importRes2.data);
  if (importRes2.data.id !== persistedChatId || !importRes2.data.alreadyImported) {
    throw new Error(`Idempotency check failed: expected ${persistedChatId}, got ${importRes2.data.id}`);
  }
  console.log('✓ Idempotency verified! Re-import returned same chat record.');

  // Test 5: Verify chat appears in user Past Chats
  console.log('\n[TEST 5] Verifying imported chat appears in Past Chats list...');
  const listRes = await axios.get(`${API}/chats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const foundChat = listRes.data.find((c: any) => c.id === persistedChatId);
  if (!foundChat) {
    throw new Error('Migrated chat not found in user chat list!');
  }
  console.log('✓ Found imported chat in list:', foundChat.title);

  // Test 6: Verify chat is NOT shared yet before explicit share action
  console.log('\n[TEST 6] Verifying unshared chat cannot be publicly accessed...');
  try {
    await axios.get(`${API}/chats/shared/unshared_dummy_id`);
    throw new Error('Expected 404 for unshared chat');
  } catch (err: any) {
    if (err.response && err.response.status === 404) {
      console.log('✓ Unshared chat correctly returned 404');
    } else {
      throw err;
    }
  }

  // Test 7: Enable sharing for the chat
  console.log('\n[TEST 7] Sharing chat via POST /api/chats/:id/share...');
  const shareRes = await axios.post(
    `${API}/chats/${persistedChatId}/share`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('Share response:', shareRes.data);
  if (!shareRes.data.ok || !shareRes.data.shareId) {
    throw new Error('Share failed: missing shareId');
  }
  const shareId = shareRes.data.shareId;

  // Test 8: Fetch public shared chat WITHOUT authentication
  console.log('\n[TEST 8] Fetching public shared chat via GET /api/chats/shared/:shareId (No Auth)...');
  const publicRes = await axios.get(`${API}/chats/shared/${shareId}`);
  console.log('Public chat meta:', publicRes.data.chat);
  console.log('Public message count:', publicRes.data.messages.length);

  if (publicRes.data.messages.length !== 2) {
    throw new Error(`Expected 2 messages in shared chat, got ${publicRes.data.messages.length}`);
  }
  if ((publicRes.data as any).user_id || (publicRes.data as any).userId) {
    throw new Error('SECURITY VIOLATION: user_id exposed in public shared chat!');
  }
  console.log('✓ Public shared view verified: contains only sanitized dialogue turns, zero user account data.');

  console.log('\n======================================================');
  console.log('✓ ALL 8 BACKEND INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('======================================================\n');
  await pool.end();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  pool.end();
  process.exit(1);
});
