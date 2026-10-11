const express = require('express');
const router = express.Router();
const ChannelGateway = require('../services/channelGateway');
const AIOrchestrator = require('../services/aiOrchestrator');
const queue = require('../services/queue');
const { readDB, writeDB } = require('../data/db');
const { v4: uuidv4 } = require('uuid');

/**
 * Webhooks Ingestion Gateway (Section 5.1 & 10.3)
 * Performance Target: Webhook acknowledgment under 500 ms (Section 11.2)
 */

// 1. Meta / WhatsApp Webhook Verification Handshake
router.get('/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'replyraja_meta_token_2026';

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Channel Gateway] Meta webhook verified successfully');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// 2. Inbound Webhook Listener (Facebook, WhatsApp, Instagram, Website)
router.post('/:channel', async (req, res) => {
  const channelType = req.params.channel;
  const signature = req.headers['x-hub-signature-256'];
  const rawBody = JSON.stringify(req.body);

  // HMAC Signature validation for Meta/WhatsApp if signature header present
  if (signature && (channelType === 'facebook' || channelType === 'whatsapp' || channelType === 'instagram')) {
    const isValid = ChannelGateway.verifyMetaSignature(rawBody, signature);
    if (!isValid) {
      console.warn(`[Security Alert] Invalid HMAC signature received for ${channelType}`);
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }
  }

  // Normalize event payload using Channel Adapter pattern
  const normalizedEvent = ChannelGateway.normalizeInboundEvent(channelType, req.body);

  // Return fast ACK under 500ms as per performance target (Section 11.2)
  res.status(200).json({ status: 'received', event_id: normalizedEvent.event_id });

  // Enqueue job for asynchronous processing (Section 4.2 & 5.1)
  queue.enqueue('channel_inbound_message', {
    channel: channelType,
    event: normalizedEvent,
    workspace_id: req.workspace_id || 'ws_demo_1',
    request_id: req.id
  });
});

// Queue Job Consumer for Inbound Message
queue.on('job:channel_inbound_message', async (job) => {
  const { channel, event, workspace_id, request_id } = job.payload;
  console.log(`[Queue Worker] Processing inbound event ${event.event_id} from ${channel} (Trace: ${request_id})`);

  const db = readDB();

  // Find or create customer
  let customer = db.customers.find(c => c.channel_user_id === event.sender_id || (c.phone && c.phone === event.sender_id));
  if (!customer) {
    customer = {
      id: 'cst_' + uuidv4().substring(0, 8),
      workspace_id,
      name: event.sender_name || 'Customer',
      phone: event.channel === 'whatsapp' ? event.sender_id : null,
      channel: event.channel,
      channel_user_id: event.sender_id,
      address: 'Bangladesh',
      lead_stage: 'new_inquiry',
      tags: ['channel_lead'],
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString()
    };
    db.customers.push(customer);
  }

  // Find or create conversation
  let conv = db.conversations.find(c => c.customer_id === customer.id && c.workspace_id === workspace_id);
  if (!conv) {
    conv = {
      id: 'conv_' + uuidv4().substring(0, 8),
      workspace_id,
      customer_id: customer.id,
      channel: event.channel,
      status: 'pending_approval',
      assigned_to: 'usr_admin_1',
      lead_stage: 'new_inquiry',
      created_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
      unread_count: 1,
      escalation_reason: null
    };
    db.conversations.push(conv);
  }

  // Store inbound customer message
  const custMsg = {
    id: event.external_message_id || 'msg_' + uuidv4().substring(0, 8),
    conversation_id: conv.id,
    sender_type: 'customer',
    text: event.text || '(Sent photo)',
    media_url: event.media_url,
    created_at: new Date().toISOString(),
    status: 'delivered'
  };
  db.messages.push(custMsg);

  // Request AI draft from AI Orchestrator
  const aiResult = await AIOrchestrator.orchestrate({
    messageText: event.text || '',
    imageUrl: event.media_url,
    conversationId: conv.id,
    workspaceId: workspace_id
  });

  const workspace = db.workspaces.find(w => w.id === workspace_id) || db.workspaces[0];

  if (aiResult.requires_human) {
    conv.status = 'escalated';
    conv.escalation_reason = aiResult.escalation_reason;
    db.audit_logs.push({
      id: 'aud_' + uuidv4().substring(0, 8),
      workspace_id,
      actor_type: 'system_ai',
      actor_name: 'Risk Classifier',
      action: 'escalate_conversation',
      details: `Escalated ${conv.id}: ${aiResult.escalation_reason} (Trace: ${request_id})`,
      created_at: new Date().toISOString()
    });
  } else if (workspace.reply_mode === 'autonomous') {
    // Autonomous auto-send
    const autoMsg = {
      id: 'msg_' + uuidv4().substring(0, 8),
      conversation_id: conv.id,
      sender_type: 'ai',
      text: aiResult.reply,
      created_at: new Date().toISOString(),
      status: 'sent',
      confidence_score: aiResult.confidence,
      reason: aiResult.sources?.[0]?.title || 'Autonomous AI'
    };
    db.messages.push(autoMsg);
    conv.status = 'open';
  } else {
    // Default Human-in-the-loop: draft only
    const draftMsg = {
      id: 'msg_' + uuidv4().substring(0, 8) + '_draft',
      conversation_id: conv.id,
      sender_type: 'ai_draft',
      text: aiResult.reply,
      confidence_score: aiResult.confidence,
      reason: aiResult.sources?.[0]?.title || 'RAG Catalog and Policy',
      sources: aiResult.sources,
      suggested_actions: aiResult.suggested_actions,
      created_at: new Date().toISOString(),
      status: 'draft_pending'
    };
    db.messages.push(draftMsg);
    conv.status = 'pending_approval';
  }

  writeDB(db);
  console.log(`[Queue Worker] Successfully processed and stored conversation ${conv.id}`);
});

module.exports = router;
