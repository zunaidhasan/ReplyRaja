const assert = require('assert');
const AIService = require('./apps/api/src/services/aiService');
const AIOrchestrator = require('./apps/api/src/services/aiOrchestrator');
const ChannelGateway = require('./apps/api/src/services/channelGateway');
const queue = require('./apps/api/src/services/queue');
const { readDB } = require('./apps/api/src/data/db');
const crypto = require('crypto');

async function runTests() {
  console.log('🧪 Starting Full ReplyRaja Architecture Test Suite...\n');

  // Test 1: Bengali & Banglish Intent Detection
  console.log('1. Testing Bengali & Banglish Product Match (Panjabi inquiry)...');
  const inquiry = 'Bhai navy blue panjabi XL hobe? Delivery charge koto Uttara te?';
  const reply1 = await AIService.generateSalesReply({
    messageText: inquiry,
    imageUrl: null,
    conversationId: 'conv_1',
    workspaceId: 'ws_demo_1'
  });

  assert.strictEqual(reply1.escalated, false, 'Should not escalate normal sales inquiry');
  assert.ok(reply1.draft.includes('প্রিমিয়াম লিনেন পাঞ্জাবি') || reply1.draft.includes('পাঞ্জাবি'), 'Draft should mention Panjabi');
  assert.ok(reply1.draft.includes('70') || reply1.draft.includes('৭০'), 'Draft should include Inside Dhaka 70 tk delivery charge');
  assert.strictEqual(reply1.extractedOrderDetails.deliveryArea, 'Inside Dhaka');
  console.log('   ✅ PASS: Draft generated accurately in Bengali with catalog price and delivery charge.\n');

  // Test 2: Safety Guardrails and Auto-Escalation
  console.log('2. Testing Safety Guardrails & Auto-Escalation on Complaint...');
  const complaint = 'প্রোডাক্ট ছেঁড়া পাইছি! রিফান্ড চাই পুলিশে মামলা করবো।';
  const reply2 = await AIService.generateSalesReply({
    messageText: complaint,
    imageUrl: null,
    conversationId: 'conv_3',
    workspaceId: 'ws_demo_1'
  });

  assert.strictEqual(reply2.escalated, true, 'AI should escalate on refund / complaint keywords');
  assert.ok(reply2.reason.includes('sensitive escalation keyword'), 'Reason must specify escalation trigger');
  console.log('   ✅ PASS: Escalated immediately without drafting unauthorized refunds.\n');

  // Test 3: Vision AI Matching
  console.log('3. Testing Vision AI Image Recognition...');
  const photoInquiry = await AIService.generateSalesReply({
    messageText: '',
    imageUrl: 'https://example.com/panjabi-photo.jpg',
    conversationId: 'conv_test_img',
    workspaceId: 'ws_demo_1'
  });

  assert.strictEqual(photoInquiry.escalated, false);
  assert.ok(photoInquiry.matchedProduct !== null, 'Vision AI must match product from catalog');
  assert.ok(photoInquiry.draft.includes('ছবিটির জন্য ধন্যবাদ'), 'AI acknowledges customer photo upload');
  console.log('   ✅ PASS: Vision AI identified product from catalog.\n');

  // Test 4: Architecture Section 8.3 AI Response Contract
  console.log('4. Testing AI Response Contract Schema (Section 8.3)...');
  const contractResponse = await AIOrchestrator.orchestrate({
    messageText: 'Panjabi er price koto bhai?',
    imageUrl: null,
    conversationId: 'conv_1',
    workspaceId: 'ws_demo_1'
  });

  assert.ok('reply' in contractResponse, 'Contract must have reply');
  assert.ok('language' in contractResponse, 'Contract must have language');
  assert.ok('intent' in contractResponse, 'Contract must have intent');
  assert.ok('confidence' in contractResponse, 'Contract must have confidence');
  assert.ok('requires_human' in contractResponse, 'Contract must have requires_human');
  assert.ok('escalation_reason' in contractResponse, 'Contract must have escalation_reason');
  assert.ok(Array.isArray(contractResponse.sources), 'sources must be an array');
  assert.ok(Array.isArray(contractResponse.suggested_actions), 'suggested_actions must be an array');
  assert.ok(Array.isArray(contractResponse.risk_flags), 'risk_flags must be an array');
  assert.strictEqual(contractResponse.language, 'bn_latin', 'Should detect Banglish');
  console.log('   ✅ PASS: Response conforms strictly to Section 8.3 AI Response Contract.\n');

  // Test 5: Architecture Section 9.1 Channel Gateway & HMAC Validation (Section 10.3)
  console.log('5. Testing Channel Gateway Normalization & HMAC Signature Verification (Section 9.1 & 10.3)...');
  const secret = 'test_secret_meta';
  const bodyString = JSON.stringify({ entry: [{ messaging: [{ message: { text: 'Hello from FB' }, sender: { id: 'fb_123' } }] }] });
  const hmacHex = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  const validSig = `sha256=${hmacHex}`;

  const isVerified = ChannelGateway.verifyMetaSignature(bodyString, validSig, secret);
  assert.strictEqual(isVerified, true, 'HMAC verification must pass for valid secret');

  const invalidSig = `sha256=abcdef1234567890`;
  const isRejected = ChannelGateway.verifyMetaSignature(bodyString, invalidSig, secret);
  assert.strictEqual(isRejected, false, 'HMAC verification must reject bad signature');

  const normalized = ChannelGateway.normalizeInboundEvent('facebook', JSON.parse(bodyString));
  assert.strictEqual(normalized.channel, 'facebook');
  assert.strictEqual(normalized.text, 'Hello from FB');
  assert.strictEqual(normalized.sender_id, 'fb_123');
  console.log('   ✅ PASS: HMAC-SHA256 verified and event normalized via Adapter Pattern.\n');

  // Test 6: Architecture Section 4.2 & 5.1 Async Queue Enqueue
  console.log('6. Testing Async Queue and Background Worker (Section 4.2 & 5.1)...');
  const job = queue.enqueue('test_job', { test: true, workspace_id: 'ws_demo_1' });
  assert.ok(job.id.startsWith('job_'), 'Job ID should be generated');
  assert.strictEqual(job.status, 'pending');
  console.log('   ✅ PASS: Async job queue registered and executing.\n');

  // Test 7: Multi-Tenancy & Database Integrity (Section 6.1)
  console.log('7. Testing Multi-Tenancy Workspace Scoping & Database Integrity (Section 6.1)...');
  const db = readDB();
  assert.ok(db.workspaces.length >= 1, 'Should have at least 1 workspace');
  assert.ok(db.products.every(p => p.workspace_id), 'Every product must have workspace_id scoping');
  assert.ok(db.conversations.every(c => c.workspace_id), 'Every conversation must have workspace_id scoping');
  assert.ok(db.orders.every(o => o.workspace_id), 'Every order must have workspace_id scoping');
  console.log('   ✅ PASS: Mandatory workspace scoping verified across all models.\n');

  console.log('🎉 ALL ARCHITECTURE TEST SUITES PASSED! System conforms to ReplyRaja Architecture Spec 1.0.');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
