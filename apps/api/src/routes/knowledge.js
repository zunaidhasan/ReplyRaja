const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../data/db');
const { v4: uuidv4 } = require('uuid');

// 1. Get products
router.get('/products', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  res.json(db.products.filter(p => p.workspace_id === workspaceId));
});

// 2. Add product
router.post('/products', (req, res) => {
  const db = readDB();
  const { title, bangla_title, price, stock, sizes, colors, sku, description, image_url } = req.body;
  const newProduct = {
    id: 'prd_' + uuidv4().substring(0, 8),
    workspace_id: req.body.workspace_id || 'ws_demo_1',
    title,
    bangla_title: bangla_title || title,
    price: Number(price),
    stock: Number(stock) || 0,
    sizes: Array.isArray(sizes) ? sizes : [sizes || 'Standard'],
    colors: Array.isArray(colors) ? colors : [colors || 'Default'],
    sku: sku || 'SKU-' + Math.floor(100 + Math.random() * 900),
    description: description || '',
    image_url: image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'
  };
  db.products.push(newProduct);
  writeDB(db);
  res.status(201).json(newProduct);
});

// 3. Get FAQs
router.get('/faqs', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  res.json(db.faqs.filter(f => f.workspace_id === workspaceId));
});

// 4. Add FAQ
router.post('/faqs', (req, res) => {
  const db = readDB();
  const { question, answer } = req.body;
  if (!question || !answer) return res.status(400).json({ error: 'Question and answer required' });

  const newFaq = {
    id: 'faq_' + uuidv4().substring(0, 8),
    workspace_id: req.body.workspace_id || 'ws_demo_1',
    question,
    answer
  };
  db.faqs.push(newFaq);
  writeDB(db);
  res.status(201).json(newFaq);
});

// 5. Test Chat Sandbox Endpoint (Simulate real merchant question testing)
router.post('/test-chat', async (req, res) => {
  const { message, image_url, workspace_id = 'ws_demo_1' } = req.body;
  const AIService = require('../services/aiService');

  const result = await AIService.generateSalesReply({
    messageText: message,
    imageUrl: image_url,
    conversationId: 'test_sandbox',
    workspaceId
  });

  res.json(result);
});

module.exports = router;
