module.exports = {
  BRAND_NAME: process.env.BRAND_NAME || 'ReplyRaja',
  BRAND_TAGLINE_EN: 'AI that turns customer messages into orders',
  BRAND_TAGLINE_BN: 'কাস্টমারের মেসেজকে অর্ডারে পরিণত করুন',
  PORT: process.env.PORT || 4000,
  JWT_SECRET: process.env.JWT_SECRET || 'replyraja-super-secret-jwt-key-2026',
  DEFAULT_LANGUAGE: 'bn',
  CURRENCY: 'BDT',
  CURRENCY_SYMBOL: '৳',
  CHANNELS: ['facebook', 'whatsapp', 'instagram', 'website'],
  REPLY_MODES: {
    DRAFT_ONLY: 'draft_only',
    ASSISTED: 'assisted',
    AUTONOMOUS: 'autonomous'
  },
  LEAD_STAGES: [
    'new_inquiry',
    'product_discussed',
    'price_sent',
    'payment_pending',
    'order_placed',
    'delivered',
    'returned',
    'lost'
  ],
  ORDER_STATUSES: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
  PAYMENT_METHODS: ['cod', 'bkash', 'nagad', 'bank_transfer'],
  DEFAULT_DELIVERY_CHARGES: {
    INSIDE_DHAKA: 70,
    OUTSIDE_DHAKA: 130
  }
};
