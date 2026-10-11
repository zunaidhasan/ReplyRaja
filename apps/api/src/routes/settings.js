const express = require('express');
const router = express.Router();
const { readDB, writeDB } = require('../data/db');

// 1. Get workspace settings & reply mode
router.get('/settings', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  const workspace = db.workspaces.find(w => w.id === workspaceId);
  const channels = db.channels.filter(c => c.workspace_id === workspaceId);
  res.json({ workspace, channels });
});

// 2. Update reply mode & escalation rules
router.patch('/settings', (req, res) => {
  const db = readDB();
  const workspaceId = req.body.workspace_id || 'ws_demo_1';
  const workspace = db.workspaces.find(w => w.id === workspaceId);
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

  const { reply_mode, auto_escalation_rules, brand_name } = req.body;
  if (reply_mode) workspace.reply_mode = reply_mode;
  if (auto_escalation_rules) workspace.auto_escalation_rules = { ...workspace.auto_escalation_rules, ...auto_escalation_rules };
  if (brand_name) workspace.brand_name = brand_name;

  writeDB(db);
  res.json({ success: true, workspace });
});

// 3. Connect/Disconnect messaging channel
router.post('/channels/:id/toggle', (req, res) => {
  const db = readDB();
  const channel = db.channels.find(c => c.id === req.params.id);
  if (!channel) return res.status(404).json({ error: 'Channel not found' });

  channel.status = channel.status === 'connected' ? 'disconnected' : 'connected';
  writeDB(db);
  res.json({ success: true, channel });
});

// 4. Audit logs
router.get('/audit-logs', (req, res) => {
  const db = readDB();
  const workspaceId = req.query.workspace_id || 'ws_demo_1';
  res.json(db.audit_logs.filter(a => a.workspace_id === workspaceId).reverse());
});

module.exports = router;
