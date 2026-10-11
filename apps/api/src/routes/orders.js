const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../data/db');
const { v4: uuidv4 } = require('uuid');

// 1. Get all orders
router.get('/', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  const { status, payment_method, search } = req.query;

  let orders = db.orders.filter(o => o.workspace_id === workspaceId);

  if (status && status !== 'all') {
    orders = orders.filter(o => o.order_status === status);
  }
  if (payment_method && payment_method !== 'all') {
    orders = orders.filter(o => o.payment_method === payment_method);
  }

  if (search) {
    const s = search.toLowerCase();
    orders = orders.filter(o => 
      o.customer_name.toLowerCase().includes(s) || 
      o.customer_phone.includes(s) ||
      o.id.toLowerCase().includes(s)
    );
  }

  res.json(orders);
});

// 2. Create order from conversation or manual form
router.post('/', (req, res) => {
  const db = readDB();
  const {
    workspace_id = 'ws_demo_1',
    conversation_id,
    customer_id,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_area = 'Inside Dhaka',
    items,
    delivery_charge = 70,
    payment_method = 'cod',
    courier_name = 'RedX',
    notes = ''
  } = req.body;

  if (!customer_name || !customer_phone || !delivery_address || !items || items.length === 0) {
    return res.status(400).json({ error: 'Customer name, phone, address and at least 1 item are required' });
  }

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const total_amount = subtotal + Number(delivery_charge);

  const orderId = 'ord_' + Math.floor(1000 + Math.random() * 9000);

  const newOrder = {
    id: orderId,
    workspace_id,
    conversation_id,
    customer_id,
    customer_name,
    customer_phone,
    delivery_address,
    delivery_area,
    items,
    subtotal,
    delivery_charge: Number(delivery_charge),
    total_amount,
    payment_method,
    payment_status: payment_method === 'cod' ? 'pending' : 'verified',
    order_status: 'confirmed',
    courier_name,
    tracking_id: courier_name ? `${courier_name.substring(0, 3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}` : null,
    notes,
    created_at: new Date().toISOString()
  };

  db.orders.unshift(newOrder);

  // Update customer CRM profile
  let customer = db.customers.find(c => c.id === customer_id || c.phone === customer_phone);
  if (customer) {
    customer.lead_stage = 'order_placed';
    customer.total_orders = (customer.total_orders || 0) + 1;
    customer.total_spent = (customer.total_spent || 0) + total_amount;
    customer.address = delivery_address;
  }

  // Update conversation lead stage if linked
  if (conversation_id) {
    const conv = db.conversations.find(c => c.id === conversation_id);
    if (conv) conv.lead_stage = 'order_placed';
  }

  // Audit log
  db.audit_logs.push({
    id: 'aud_' + uuidv4().substring(0, 8),
    workspace_id,
    actor_type: 'human_agent',
    actor_name: 'Agent',
    action: 'create_order',
    details: `Created order #${orderId} for ${customer_name} (Total: ৳${total_amount})`,
    created_at: new Date().toISOString()
  });

  writeDB(db);
  res.status(201).json({ success: true, order: newOrder });
});

// 3. Update order / courier status
router.patch('/:id', (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { order_status, courier_name, tracking_id, payment_status, notes } = req.body;
  if (order_status) order.order_status = order_status;
  if (courier_name) order.courier_name = courier_name;
  if (tracking_id) order.tracking_id = tracking_id;
  if (payment_status) order.payment_status = payment_status;
  if (notes !== undefined) order.notes = notes;

  writeDB(db);
  res.json({ success: true, order });
});

module.exports = router;
