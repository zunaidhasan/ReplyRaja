const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/branding');
const tenantMiddleware = require('./middleware/tenantMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Multi-tenant and distributed request tracing middleware (Section 6 & 12.3)
app.use(tenantMiddleware);

// Request logging middleware with request_id trace
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}][${req.id}][${req.workspace_id}] ${req.method} ${req.url}`);
  next();
});

// Branding metadata API
app.get('/api/branding', (req, res) => {
  res.json({
    brand_name: config.BRAND_NAME,
    tagline_en: config.BRAND_TAGLINE_EN,
    tagline_bn: config.BRAND_TAGLINE_BN,
    reply_modes: config.REPLY_MODES,
    lead_stages: config.LEAD_STAGES,
    order_statuses: config.ORDER_STATUSES,
    payment_methods: config.PAYMENT_METHODS
  });
});

// Core API Routes
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/crm', require('./routes/crm'));
app.use('/api/settings', require('./routes/settings'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', brand: config.BRAND_NAME, timestamp: new Date().toISOString() });
});

// Serve frontend static files
const webDistPath = path.join(__dirname, '../../../apps/web/public');
app.use(express.static(webDistPath));

// Fallback for single page app routing
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  const indexPath = path.join(webDistPath, 'index.html');
  res.sendFile(indexPath);
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 ${config.BRAND_NAME} API Service running on http://localhost:${PORT}`);
  console.log(`✨ Bengali-first AI Sales Assistant & Omnichannel Inbox`);
  console.log(`====================================================`);
});
