const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'store.json');

// Initial seed data
const initialData = {
  workspaces: [
    {
      id: 'ws_demo_1',
      name: 'Aariz Fashion Dhaka',
      brand_name: 'Aariz Fashion',
      owner_email: 'merchant@aarizfashion.com',
      reply_mode: 'draft_only', // draft_only | assisted | autonomous
      auto_escalation_rules: {
        keywords: ['refund', 'রিফান্ড', 'complain', 'অভিযোগ', 'police', 'fraud', 'বাতিল', 'damage'],
        min_order_value: 5000,
        low_confidence_threshold: 0.65,
        after_hours_auto_draft: true
      },
      delivery_zones: [
        { name: 'Inside Dhaka', charge: 70, time: '24-48 hours' },
        { name: 'Outside Dhaka', charge: 130, time: '3-5 days' }
      ],
      payment_methods: [
        { type: 'cod', enabled: true, details: 'Cash on Delivery available all over Bangladesh' },
        { type: 'bkash', enabled: true, number: '01711000111', type_desc: 'Merchant / Personal' },
        { type: 'nagad', enabled: true, number: '01811000222', type_desc: 'Personal' }
      ],
      return_policy: '৭ দিনের মধ্যে পণ্য ফেরত বা পরিবর্তনের সুযোগ রয়েছে। প্রোডাক্টে কোনো সমস্যা থাকলে সাথে সাথে ডেলিভারি ম্যানের সামনে চেক করুন।'
    }
  ],
  users: [
    {
      id: 'usr_admin_1',
      workspace_id: 'ws_demo_1',
      name: 'Zunaid Ishan',
      email: 'merchant@aarizfashion.com',
      password_hash: 'demo1234', // For demo auth
      role: 'owner' // owner | agent | agency_admin
    },
    {
      id: 'usr_agent_1',
      workspace_id: 'ws_demo_1',
      name: 'Tanvir Ahmed',
      email: 'agent@aarizfashion.com',
      password_hash: 'demo1234',
      role: 'agent'
    }
  ],
  channels: [
    {
      id: 'chn_fb_1',
      workspace_id: 'ws_demo_1',
      type: 'facebook',
      name: 'Aariz Fashion FB Page',
      identifier: 'aariz_fashion_bd',
      status: 'connected',
      connected_at: '2026-10-01T10:00:00Z'
    },
    {
      id: 'chn_wa_1',
      workspace_id: 'ws_demo_1',
      type: 'whatsapp',
      name: 'Aariz WhatsApp Business',
      identifier: '+8801711000111',
      status: 'connected',
      connected_at: '2026-10-01T10:00:00Z'
    },
    {
      id: 'chn_ig_1',
      workspace_id: 'ws_demo_1',
      type: 'instagram',
      name: '@aarizfashion.bd',
      identifier: 'aarizfashion.bd',
      status: 'connected',
      connected_at: '2026-10-02T12:00:00Z'
    },
    {
      id: 'chn_web_1',
      workspace_id: 'ws_demo_1',
      type: 'website',
      name: 'aarizfashion.com Live Chat',
      identifier: 'widget_key_aariz_999',
      status: 'connected',
      connected_at: '2026-10-03T15:00:00Z'
    }
  ],
  products: [
    {
      id: 'prd_1',
      workspace_id: 'ws_demo_1',
      title: 'Premium Linen Panjabi (Royal Navy)',
      bangla_title: 'প্রিমিয়াম লিনেন পাঞ্জাবি (রয়্যাল নেভি)',
      price: 1850,
      stock: 45,
      sizes: ['M (38)', 'L (40)', 'XL (42)', 'XXL (44)'],
      colors: ['Navy Blue', 'Maroon', 'White'],
      sku: 'PNJ-NAVY-01',
      image_url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
      description: '১০০% পিওর কটন লিনেন ফেব্রিক, আরামদায়ক সেলাই ও মার্জিত কাট। ঈদ ও উৎসবের উপযোগী।'
    },
    {
      id: 'prd_2',
      workspace_id: 'ws_demo_1',
      title: 'Traditional Handloom Cotton Saree',
      bangla_title: 'ঐতিহ্যবাহী তাঁতের সুতি শাড়ি',
      price: 1450,
      stock: 22,
      sizes: ['Regular 12 Haat with Blouse Piece'],
      colors: ['Red & Black', 'Mustard Yellow', 'Forest Green'],
      sku: 'SR-COTTON-02',
      image_url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=600&q=80',
      description: 'টাঙ্গাইলের ঐতিহ্যবাহী সুতি তাঁত শাড়ি। হালকা, নরম এবং গরমে পরার জন্য আদর্শ।'
    },
    {
      id: 'prd_3',
      workspace_id: 'ws_demo_1',
      title: 'Men Slim Fit Chino Pants',
      bangla_title: 'মেনস স্লিম ফিট চিনো প্যান্ট',
      price: 1100,
      stock: 60,
      sizes: ['30', '32', '34', '36'],
      colors: ['Khaki', 'Olive Green', 'Charcoal Grey'],
      sku: 'CHINO-MEN-03',
      image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=600&q=80',
      description: 'স্ট্রেচেবল আরামদায়ক কটন টুইল ফেব্রিক। অফিস এবং ক্যাজুয়াল ব্যবহারের জন্য পারফেক্ট।'
    },
    {
      id: 'prd_4',
      workspace_id: 'ws_demo_1',
      title: 'Leather Wallet & Belt Combo Box',
      bangla_title: 'আসল চামড়ার ওয়ালেট ও বেল্ট কম্বো গিফট বক্স',
      price: 1650,
      stock: 35,
      sizes: ['Standard Box'],
      colors: ['Deep Brown', 'Classic Black'],
      sku: 'BOX-LFT-04',
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80',
      description: '১০০% অরিজিনাল লেদার। আকর্ষণীয় কাঠের গিফট বক্স প্যাকেজিং সহ।'
    }
  ],
  faqs: [
    {
      id: 'faq_1',
      workspace_id: 'ws_demo_1',
      question: 'ডেলিভারি চার্জ কত এবং কতদিন সময় লাগে?',
      answer: 'ঢাকার ভিতরে ডেলিভারি চার্জ ৭০ টাকা (২৪-৪৮ ঘণ্টায় ডেলিভারি), এবং ঢাকার বাইরে ১৩০ টাকা (৩-৫ কর্মদিবস)।'
    },
    {
      id: 'faq_2',
      workspace_id: 'ws_demo_1',
      question: 'ক্যাশ অন ডেলিভারি (COD) কি আছে?',
      answer: 'হ্যাঁ, সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা রয়েছে। ডেলিভারি ম্যানের কাছ থেকে প্রোডাক্ট দেখে বুঝে টাকা দিতে পারবেন।'
    },
    {
      id: 'faq_3',
      workspace_id: 'ws_demo_1',
      question: 'বিকাশ বা নগদে পেমেন্ট করার নিয়ম কী?',
      answer: 'বিকাশ মার্চেন্ট/পার্সোনাল নম্বর: 01711000111 এবং নগদ নম্বর: 01811000222। পেমেন্ট শেষে ট্রানজেকশন আইডি বা লাস্ট ৪ ডিজিট জানিয়ে দিলে অর্ডার কনফার্ম হবে।'
    },
    {
      id: 'faq_4',
      workspace_id: 'ws_demo_1',
      question: 'সাইজ ছোট-বড় হলে কি পরিবর্তন করা যাবে?',
      answer: 'জ্বি, ডেলিভারি পাওয়ার ৭ দিনের মধ্যে সাইজ এক্সচেঞ্জ সুবিধা পাবেন। তবে প্রোডাক্ট অবিকৃত ও ইনট্যাক্ট থাকতে হবে।'
    }
  ],
  customers: [
    {
      id: 'cst_1',
      workspace_id: 'ws_demo_1',
      name: 'Rahim Uddin',
      phone: '01712345678',
      channel: 'facebook',
      channel_user_id: 'fb_user_9981',
      address: 'House 12, Road 4, Dhanmondi, Dhaka',
      lead_stage: 'price_sent',
      tags: ['panjabi_lover', 'dhaka_resident'],
      total_orders: 1,
      total_spent: 1920,
      created_at: '2026-10-10T14:20:00Z'
    },
    {
      id: 'cst_2',
      workspace_id: 'ws_demo_1',
      name: 'Nusrat Jahan',
      phone: '01898765432',
      channel: 'whatsapp',
      channel_user_id: 'wa_user_4431',
      address: 'GEC Circle, Nasirabad, Chattogram',
      lead_stage: 'order_placed',
      tags: ['saree_inquiry', 'ctg'],
      total_orders: 1,
      total_spent: 1580,
      created_at: '2026-10-11T09:15:00Z'
    },
    {
      id: 'cst_3',
      workspace_id: 'ws_demo_1',
      name: 'Shakil Mahmud',
      phone: '01655443322',
      channel: 'instagram',
      channel_user_id: 'ig_user_1120',
      address: 'Uttara Sector 7, Dhaka',
      lead_stage: 'new_inquiry',
      tags: ['photo_search'],
      total_orders: 0,
      total_spent: 0,
      created_at: '2026-10-11T11:00:00Z'
    }
  ],
  conversations: [
    {
      id: 'conv_1',
      workspace_id: 'ws_demo_1',
      customer_id: 'cst_1',
      channel: 'facebook',
      status: 'pending_approval', // open | pending_approval | escalated | closed
      assigned_to: 'usr_admin_1',
      lead_stage: 'price_sent',
      created_at: '2026-10-11T10:15:00Z',
      last_message_at: '2026-10-11T10:45:00Z',
      unread_count: 1,
      sla_due_at: '2026-10-11T11:15:00Z',
      escalation_reason: null
    },
    {
      id: 'conv_2',
      workspace_id: 'ws_demo_1',
      customer_id: 'cst_2',
      channel: 'whatsapp',
      status: 'open',
      assigned_to: 'usr_agent_1',
      lead_stage: 'order_placed',
      created_at: '2026-10-11T09:15:00Z',
      last_message_at: '2026-10-11T09:40:00Z',
      unread_count: 0,
      sla_due_at: '2026-10-11T10:15:00Z',
      escalation_reason: null
    },
    {
      id: 'conv_3',
      workspace_id: 'ws_demo_1',
      customer_id: 'cst_3',
      channel: 'instagram',
      status: 'escalated',
      assigned_to: 'usr_admin_1',
      lead_stage: 'new_inquiry',
      created_at: '2026-10-11T11:00:00Z',
      last_message_at: '2026-10-11T11:05:00Z',
      unread_count: 1,
      sla_due_at: '2026-10-11T11:20:00Z',
      escalation_reason: 'Customer requested discount beyond policy and mentioned damaged item refund'
    }
  ],
  messages: [
    {
      id: 'msg_101',
      conversation_id: 'conv_1',
      sender_type: 'customer', // customer | agent | ai
      text: 'Bhai navy blue panjabi XL hobe? Delivery charge koto Uttara te?',
      media_url: null,
      created_at: '2026-10-11T10:44:00Z',
      status: 'delivered'
    },
    {
      id: 'msg_102_draft',
      conversation_id: 'conv_1',
      sender_type: 'ai_draft', // pending human review
      text: 'জ্বি ভাইয়া, আমাদের প্রিমিয়াম লিনেন পাঞ্জাবির Royal Navy কালারের XL (42) সাইজটি স্টকে এভেইলএবল আছে! দাম ১৮৫০ টাকা। উত্তরায় (ঢাকার ভেতরে) ডেলিভারি চার্জ মাত্র ৭০ টাকা। ক্যাশ অন ডেলিভারিতে অর্ডার করতে চাইলে আপনার ফোন নম্বর ও পূর্ণাঙ্গ ঠিকানাটি শেয়ার করুন প্লিজ।',
      suggested_product_id: 'prd_1',
      confidence_score: 0.96,
      reason: 'Matched product prd_1 (Navy XL) and Inside Dhaka delivery charge FAQ',
      created_at: '2026-10-11T10:44:05Z',
      status: 'draft_pending'
    },
    {
      id: 'msg_201',
      conversation_id: 'conv_2',
      sender_type: 'customer',
      text: 'Amar shari ta delivery kobe pabo? tracking ase kono?',
      created_at: '2026-10-11T09:35:00Z',
      status: 'delivered'
    },
    {
      id: 'msg_202',
      conversation_id: 'conv_2',
      sender_type: 'agent',
      text: 'আপু আপনার অর্ডারটি রেডএক্স কুরিয়ারে হ্যান্ডওভার করা হয়েছে (ট্র্যাকিং আইডি: RDX-98231)। ইনশাআল্লাহ আগামী পরশুর মধ্যে চট্টগ্রামে ডেলিভারি পৌঁছে যাবে!',
      created_at: '2026-10-11T09:40:00Z',
      status: 'delivered'
    },
    {
      id: 'msg_301',
      conversation_id: 'conv_3',
      sender_type: 'customer',
      text: 'Ager order a shari ta chera chilo. Refund chai ar ai panjabi te 500 taka chhar dile nibo.',
      created_at: '2026-10-11T11:05:00Z',
      status: 'delivered'
    }
  ],
  orders: [
    {
      id: 'ord_1001',
      workspace_id: 'ws_demo_1',
      conversation_id: 'conv_2',
      customer_id: 'cst_2',
      customer_name: 'Nusrat Jahan',
      customer_phone: '01898765432',
      delivery_address: 'GEC Circle, Nasirabad, Chattogram',
      delivery_area: 'Outside Dhaka',
      items: [
        { product_id: 'prd_2', title: 'ঐতিহ্যবাহী তাঁতের সুতি শাড়ি', variant: 'Red & Black', quantity: 1, price: 1450 }
      ],
      subtotal: 1450,
      delivery_charge: 130,
      total_amount: 1580,
      payment_method: 'cod',
      payment_status: 'pending',
      order_status: 'shipped',
      courier_name: 'RedX',
      tracking_id: 'RDX-98231',
      notes: 'Customer requested fast delivery',
      created_at: '2026-10-11T09:30:00Z'
    }
  ],
  audit_logs: [
    {
      id: 'aud_1',
      workspace_id: 'ws_demo_1',
      actor_type: 'system_ai',
      actor_name: 'ReplyRaja AI Agent',
      action: 'generate_draft',
      details: 'Drafted reply for conversation conv_1 with 96% confidence',
      created_at: '2026-10-11T10:44:05Z'
    },
    {
      id: 'aud_2',
      workspace_id: 'ws_demo_1',
      actor_type: 'system_ai',
      actor_name: 'ReplyRaja Safety Filter',
      action: 'escalate_conversation',
      details: 'Escalated conv_3: refund keyword detected and discount beyond guardrails',
      created_at: '2026-10-11T11:05:02Z'
    }
  ]
};

// Initialize DB file if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
}

function readDB() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return initialData;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = {
  readDB,
  writeDB
};
