const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../data/db');
const AIService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

// 1. Get all conversations with customer & last message details
router.get('/', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  const { channel, status, lead_stage, search } = req.query;

  let convs = db.conversations.filter(c => c.workspace_id === workspaceId);

  if (channel && channel !== 'all') {
    convs = convs.filter(c => c.channel === channel);
  }
  if (status && status !== 'all') {
    convs = convs.filter(c => c.status === status);
  }
  if (lead_stage && lead_stage !== 'all') {
    convs = convs.filter(c => c.lead_stage === lead_stage);
  }

  // Enrich with customer details and latest messages
  const enriched = convs.map(conv => {
    const customer = db.customers.find(c => c.id === conv.customer_id);
    const messages = db.messages.filter(m => m.conversation_id === conv.id);
    const lastMessage = messages[messages.length - 1] || null;
    const pendingDraft = messages.find(m => m.sender_type === 'ai_draft' && m.status === 'draft_pending');

    return {
      ...conv,
      customer,
      lastMessage,
      pendingDraft,
      messageCount: messages.length
    };
  });

  if (search) {
    const s = search.toLowerCase();
    return res.json(enriched.filter(c => 
      c.customer?.name.toLowerCase().includes(s) || 
      c.customer?.phone?.includes(s) ||
      c.lastMessage?.text?.toLowerCase().includes(s)
    ));
  }

  res.json(enriched);
});

// 2. Get specific conversation with full message thread & orders
router.get('/:id', (req, res) => {
  const db = readDB();
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const customer = db.customers.find(c => c.id === conv.customer_id);
  const messages = db.messages.filter(m => m.conversation_id === conv.id);
  const customerOrders = db.orders.filter(o => o.customer_id === conv.customer_id);

  res.json({
    conversation: conv,
    customer,
    messages,
    orders: customerOrders
  });
});

// 3. Receive new customer message (Simulates webhook or incoming chat)
router.post('/:id/messages/incoming', async (req, res) => {
  const db = readDB();
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const { text, media_url } = req.body;
  if (!text && !media_url) {
    return res.status(400).json({ error: 'Message text or media is required' });
  }

  // Create customer message
  const customerMsg = {
    id: 'msg_' + uuidv4().substring(0, 8),
    conversation_id: conv.id,
    sender_type: 'customer',
    text: text || '(Sent photo)',
    media_url: media_url || null,
    created_at: new Date().toISOString(),
    status: 'delivered'
  };
  db.messages.push(customerMsg);

  conv.last_message_at = customerMsg.created_at;
  conv.unread_count = (conv.unread_count || 0) + 1;

  // Run AI Sales Assistant
  const aiResult = await AIService.generateSalesReply({
    messageText: text || '',
    imageUrl: media_url,
    conversationId: conv.id,
    workspaceId: conv.workspace_id
  });

  const workspace = db.workspaces.find(w => w.id === conv.workspace_id);

  if (aiResult.escalated) {
    conv.status = 'escalated';
    conv.escalation_reason = aiResult.reason;
    db.audit_logs.push({
      id: 'aud_' + uuidv4().substring(0, 8),
      workspace_id: conv.workspace_id,
      actor_type: 'system_ai',
      actor_name: 'Escalation Filter',
      action: 'escalate_conversation',
      details: `Escalated conversation ${conv.id}: ${aiResult.reason}`,
      created_at: new Date().toISOString()
    });
  } else if (workspace.reply_mode === 'autonomous') {
    // Autonomous Mode: Send message immediately
    const autoReplyMsg = {
      id: 'msg_' + uuidv4().substring(0, 8),
      conversation_id: conv.id,
      sender_type: 'ai',
      text: aiResult.draft,
      created_at: new Date().toISOString(),
      status: 'sent',
      confidence_score: aiResult.confidence,
      reason: aiResult.reason
    };
    db.messages.push(autoReplyMsg);
    conv.status = 'open';
  } else {
    // Draft Only or Assisted Mode (DEFAULT): Prepare Draft for human approval
    const draftMsg = {
      id: 'msg_' + uuidv4().substring(0, 8) + '_draft',
      conversation_id: conv.id,
      sender_type: 'ai_draft',
      text: aiResult.draft,
      confidence_score: aiResult.confidence,
      reason: aiResult.reason,
      suggested_product: aiResult.matchedProduct,
      extractedOrderDetails: aiResult.extractedOrderDetails,
      created_at: new Date().toISOString(),
      status: 'draft_pending'
    };
    db.messages.push(draftMsg);
    conv.status = 'pending_approval';
  }

  writeDB(db);
  res.json({ success: true, customerMsg, aiResult });
});

// 4. Human-In-The-Loop: Approve or Edit & Send AI Draft
router.post('/:id/drafts/:draftId/approve', (req, res) => {
  const db = readDB();
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const draftIndex = db.messages.findIndex(m => m.id === req.params.draftId);
  if (draftIndex === -1) return res.status(404).json({ error: 'Draft not found' });

  const { edited_text } = req.body;
  const draft = db.messages[draftIndex];

  // Convert draft into approved human/sent message
  const sentMessage = {
    id: 'msg_' + uuidv4().substring(0, 8),
    conversation_id: conv.id,
    sender_type: 'agent',
    text: edited_text || draft.text,
    created_at: new Date().toISOString(),
    status: 'delivered',
    was_ai_assisted: true,
    original_ai_draft: draft.text
  };

  // Remove pending draft and insert sent message
  db.messages.splice(draftIndex, 1);
  db.messages.push(sentMessage);

  conv.status = 'open';
  conv.unread_count = 0;
  conv.last_message_at = sentMessage.created_at;

  db.audit_logs.push({
    id: 'aud_' + uuidv4().substring(0, 8),
    workspace_id: conv.workspace_id,
    actor_type: 'human_agent',
    actor_name: 'Agent',
    action: 'approve_ai_draft',
    details: `Approved AI draft for ${conv.id}${edited_text ? ' with human edits' : ' without edits'}`,
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.json({ success: true, message: sentMessage });
});

// 5. Send manual human agent message
router.post('/:id/messages', (req, res) => {
  const db = readDB();
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Message text required' });

  const agentMsg = {
    id: 'msg_' + uuidv4().substring(0, 8),
    conversation_id: conv.id,
    sender_type: 'agent',
    text,
    created_at: new Date().toISOString(),
    status: 'delivered'
  };

  db.messages.push(agentMsg);
  conv.unread_count = 0;
  conv.last_message_at = agentMsg.created_at;

  writeDB(db);
  res.json({ success: true, message: agentMsg });
});

// 6. Update conversation status (resolve, escalate, assign)
router.patch('/:id', (req, res) => {
  const db = readDB();
  const conv = db.conversations.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });

  const { status, assigned_to, lead_stage, escalation_reason } = req.body;
  if (status) conv.status = status;
  if (assigned_to) conv.assigned_to = assigned_to;
  if (lead_stage) {
    conv.lead_stage = lead_stage;
    const customer = db.customers.find(c => c.id === conv.customer_id);
    if (customer) customer.lead_stage = lead_stage;
  }
  if (escalation_reason !== undefined) conv.escalation_reason = escalation_reason;

  writeDB(db);
  res.json({ success: true, conversation: conv });
});

module.exports = router;
