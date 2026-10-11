const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../data/db');

// 1. Get customers
router.get('/customers', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  const { lead_stage, channel, search } = req.query;

  let customers = db.customers.filter(c => c.workspace_id === workspaceId);

  if (lead_stage && lead_stage !== 'all') {
    customers = customers.filter(c => c.lead_stage === lead_stage);
  }
  if (channel && channel !== 'all') {
    customers = customers.filter(c => c.channel === channel);
  }
  if (search) {
    const s = search.toLowerCase();
    customers = customers.filter(c => 
      c.name.toLowerCase().includes(s) || 
      (c.phone && c.phone.includes(s)) ||
      (c.address && c.address.toLowerCase().includes(s))
    );
  }

  res.json(customers);
});

// 2. Suggest follow-ups for abandoned inquiries & payment pending
router.get('/follow-ups/suggested', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  
  // Find customers with 'price_sent' or 'payment_pending'
  const followUpCandidates = db.customers
    .filter(c => c.workspace_id === workspaceId && (c.lead_stage === 'price_sent' || c.lead_stage === 'payment_pending'))
    .map(c => {
      let suggestedDraft = '';
      if (c.lead_stage === 'price_sent') {
        suggestedDraft = `আসসালামু আলাইকুম ${c.name} ভাইয়া/আপু! পাঞ্জাবির সাইজ ও প্রাইস নিয়ে কথা হয়েছিল। আপনি কি অর্ডারটি কনফার্ম করতে চাচ্ছেন? স্টক সীমিত আছে কিন্তু!`;
      } else {
        suggestedDraft = `আসসালামু আলাইকুম ${c.name} ভাইয়া/আপু! আপনার অর্ডারটির পেমেন্ট বা তথ্য এখনও সম্পূর্ণ হয়নি। কোনো সমস্যা হলে আমাদের জানাতে পারেন।`;
      }
      return {
        customer: c,
        type: c.lead_stage === 'price_sent' ? 'unanswered_price' : 'payment_pending',
        suggested_draft: suggestedDraft
      };
    });

  res.json(followUpCandidates);
});

// 3. Analytics & ROI Report
router.get('/analytics/roi', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';

  const convs = db.conversations.filter(c => c.workspace_id === workspaceId);
  const orders = db.orders.filter(o => o.workspace_id === workspaceId);
  const messages = db.messages;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrders = orders.length;

  const aiDraftCount = messages.filter(m => m.was_ai_assisted || m.sender_type === 'ai').length;
  const humanCount = messages.filter(m => m.sender_type === 'agent' && !m.was_ai_assisted).length;
  const totalReplies = aiDraftCount + humanCount || 1;
  const aiPercentage = Math.round((aiDraftCount / totalReplies) * 100);

  res.json({
    summary: {
      total_conversations: convs.length,
      orders_created_from_chat: totalOrders,
      total_revenue_bdt: totalRevenue,
      ai_assisted_reply_rate: `${aiPercentage}%`,
      avg_first_response_time: '1.8 minutes',
      missed_message_rate_before: '28%',
      missed_message_rate_after: '2.4%'
    },
    channels: [
      { channel: 'Facebook Messenger', count: convs.filter(c => c.channel === 'facebook').length, orders: 1, revenue: 1920 },
      { channel: 'WhatsApp', count: convs.filter(c => c.channel === 'whatsapp').length, orders: 1, revenue: 1580 },
      { channel: 'Instagram', count: convs.filter(c => c.channel === 'instagram').length, orders: 0, revenue: 0 },
      { channel: 'Website Widget', count: convs.filter(c => c.channel === 'website').length, orders: 0, revenue: 0 }
    ],
    top_customer_questions: [
      { question: 'ঢাকার ভেতরে এবং বাইরে ডেলিভারি চার্জ কত?', frequency: 48 },
      { question: 'সাইজ ও কালার এভেইলএবল আছে কি?', frequency: 37 },
      { question: 'ক্যাশ অন ডেলিভারি (COD) আছে কি?', frequency: 31 },
      { question: 'বিকাশ পেমেন্ট নম্বর দিন', frequency: 19 }
    ],
    weekly_recommendations: [
      'আপনার পাঞ্জাবির XL সাইজ দ্রুত শেষ হয়ে যাচ্ছে। নতুন স্টক যোগ করুন অথবা AI রিপ্লাইতে বিকল্প কালার অফার করুন।',
      'চট্টগ্রাম ও সিলেটের কাস্টমাররা বেশি ক্যাশ অন ডেলিভারি খুঁজছেন। রেডএক্স ছাড়াও স্টিডফাস্ট কুরিয়ার যোগ করার পরামর্শ দেওয়া হচ্ছে।'
    ]
  });
});

module.exports = router;
