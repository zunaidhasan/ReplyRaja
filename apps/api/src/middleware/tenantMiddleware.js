const { v4: uuidv4 } = require('uuid');

/**
 * Request Tracing and Workspace Isolation Middleware (Sections 6.2, 10.2 & 12.3)
 * Propagates request_id across:
 * API Gateway → Core API → Queue → Worker → AI Service → Channel Adapter
 */

function requestTracingAndTenantMiddleware(req, res, next) {
  // 1. Assign or propagate distributed trace request_id
  const requestId = req.headers['x-request-id'] || `req_${uuidv4().substring(0, 8)}`;
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  // 2. Resolve and isolate workspace tenant (Section 6.1 & 6.2)
  const workspaceId = req.headers['x-workspace-id'] || req.query.workspace_id || req.body?.workspace_id || 'ws_demo_1';
  req.workspace_id = workspaceId;
  res.setHeader('X-Workspace-Id', workspaceId);

  // 3. User authorization context
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    req.user = {
      id: 'usr_admin_1',
      role: 'owner',
      workspace_id: workspaceId
    };
  } else {
    // Demo merchant context
    req.user = {
      id: 'usr_agent_1',
      role: 'agent',
      workspace_id: workspaceId
    };
  }

  next();
}

module.exports = requestTracingAndTenantMiddleware;
