# ReplyRaja — Technical Requirements Document (TRD)

**Product:** ReplyRaja  
**Version:** 1.0  
**Date:** October 11, 2026  
**Owner:** Zunaid Ishan  
**Status:** Ready for engineering/agency review  
**Related documents:** `PRD.md`, `ARCHITECTURE.md`, `ROADMAP.md`

---

## 1. Purpose

This Technical Requirements Document defines the architecture, data model, integrations, AI system, security controls, infrastructure, APIs, testing strategy, and delivery requirements for ReplyRaja.

ReplyRaja is an AI customer-conversation and sales-assistant SaaS for Bangladeshi SMBs. It connects Facebook Messenger, WhatsApp, Instagram, and website chat; drafts replies; captures leads and orders; and enables controlled human takeover.

---

## 2. System Overview

### 2.1 High-Level Architecture

```text
Customer
  │
  ├── Facebook Messenger
  ├── WhatsApp
  ├── Instagram
  └── Website Chat Widget
          │
          ▼
   Meta / Channel Webhooks
          │
          ▼
┌─────────────────────────────┐
│        API Gateway           │
│  Auth, rate limits, routing  │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│      Core Application        │
│  Inbox, CRM, Orders, KB      │
└──────┬───────────┬───────────┘
       │           │
       ▼           ▼
┌────────────┐  ┌────────────────┐
│ AI Service │  │ Background Jobs │
│ RAG + LLM  │  │ Queue + Workers │
└──────┬─────┘  └────────────────┘
       │
       ▼
┌─────────────────────────────┐
│ Vector Store + Object Storage│
└─────────────────────────────┘
```

### 2.2 Core Services

| Service | Responsibility |
|---|---|
| Web application | Merchant dashboard, inbox, settings, CRM, orders, analytics |
| API service | REST APIs, authentication, authorization, business logic |
| Channel gateway | Meta webhooks, WhatsApp Cloud API, Instagram API, website-chat events |
| AI orchestration service | Intent detection, retrieval, prompt construction, response drafting, guardrails |
| Knowledge service | FAQ, product catalog, policy ingestion, embedding, retrieval |
| Order service | Order creation, status, payment method, courier status |
| Notification service | Email, in-app alerts, escalation alerts, follow-up reminders |
| Billing service | Plans, usage metering, invoices, trial management |
| Admin service | Internal support, workspace management, impersonation controls |
| Chrome extension backend | Extension auth, customer context, draft generation, handoff alerts |

---

## 3. Technology Stack

### 3.1 Recommended Stack

| Layer | Recommended technology | Rationale |
|---|---|---|
| Web frontend | Next.js 14+ with TypeScript | SEO-friendly marketing site and app in one ecosystem |
| UI | Tailwind CSS + shadcn/ui or MUI | Fast, consistent, responsive UI |
| State/data fetching | TanStack Query + Zustand | Efficient API caching and client state |
| Backend API | NestJS with TypeScript or FastAPI with Python | Modular services, strong typing, mature ecosystem |
| Primary database | PostgreSQL 15+ | Relational integrity for workspaces, users, conversations, orders |
| Cache/queue | Redis 7+ | Rate limiting, caching, job queues |
| Background jobs | BullMQ for Node.js or Celery for Python | Webhook processing, AI jobs, reminders, retries |
| Vector database | PostgreSQL pgvector initially; Qdrant later if needed | Simple MVP operations with a clear upgrade path |
| Object storage | AWS S3, Cloudflare R2, or DigitalOcean Spaces | Product images, attachments, exports |
| AI provider | OpenAI, Anthropic, Google Gemini, or multi-provider abstraction | Provider flexibility and cost control |
| Auth | Auth.js, Clerk, Supabase Auth, or custom JWT + refresh tokens | Secure merchant and agent authentication |
| Payments | Stripe initially; local PSP integration later | Fast launch; local payments can follow |
| Email | Resend, Postmark, or Amazon SES | Transactional email |
| Error tracking | Sentry | Production debugging |
| Logging | Structured JSON logs + Loki, Datadog, or Better Stack | Searchable operational logs |
| Infrastructure | Docker + managed Kubernetes or managed containers | Reproducible deployment |
| CI/CD | GitHub Actions | Automated test, build, and deployment |
| Infrastructure as Code | Terraform or Pulumi | Repeatable infrastructure |

### 3.2 Stack Decision Rules

- Use **PostgreSQL + pgvector** for MVP unless embedding volume exceeds 10 million vectors.
- Use **one monorepo** containing `apps/web`, `apps/api`, `apps/worker`, `packages/ui`, and `packages/shared`.
- Use **TypeScript end-to-end** if the team is JavaScript-focused.
- Use **Python** for the AI service only if the team has stronger ML/RAG expertise.
- Avoid direct LLM calls inside request handlers; enqueue AI work or use streaming endpoints with timeouts.

---

## 4. Environments

| Environment | Purpose | Data |
|---|---|---|
| Local | Developer workstations | Seed/mock data |
| Preview | Per-pull-request deployments | Anonymized test data |
| Staging | QA, integration testing, Meta test apps | Synthetic data and test channels |
| Production | Live merchants | Real customer data |

### Requirements

- Separate Meta apps, API keys, database credentials, and webhook endpoints for staging and production.
- No production data may be copied into staging without anonymization.
- All environments must enforce HTTPS.
- Configuration must come from environment variables or a secrets manager; no secrets in source control.
- Database migrations must run automatically through CI/CD with rollback procedures.

---

## 5. Data Model

### 5.1 Core Entities

```text
Workspace
 ├── User
 ├── WorkspaceMember
 ├── ChannelConnection
 ├── Conversation
 │    ├── Message
 │    ├── ConversationAssignment
 │    └── InternalNote
 ├── Customer
 │    ├── CustomerTag
 │    └── LeadStageHistory
 ├── Product
 │    ├── ProductVariant
 │    └── ProductImage
 ├── KnowledgeDocument
 │    └── KnowledgeChunk
 ├── Order
 │    ├── OrderItem
 │    └── OrderStatusEvent
 ├── AISuggestion
 ├── EscalationRule
 ├── FollowUpTask
 ├── Subscription
 ├── UsageEvent
 └── AuditLog
```

### 5.2 Key Tables

#### `workspaces`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | text | Merchant/business name |
| `slug` | text | Unique workspace identifier |
| `plan` | enum | `trial`, `starter`, `growth`, `pro`, `agency` |
| `locale` | enum | `bn`, `en` |
| `timezone` | text | Default: `Asia/Dhaka` |
| `created_at` | timestamptz |  |
| `deleted_at` | timestamptz | Soft delete |

#### `users`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | citext | Unique |
| `password_hash` | text | Nullable for OAuth-only users |
| `full_name` | text |  |
| `auth_provider` | enum | `email`, `google` |
| `mfa_enabled` | boolean | Required for internal admin users |
| `last_login_at` | timestamptz |  |

#### `workspace_members`

| Field | Type | Notes |
|---|---|---|
| `workspace_id` | UUID | Foreign key |
| `user_id` | UUID | Foreign key |
| `role` | enum | `owner`, `admin`, `agent`, `viewer` |
| `status` | enum | `active`, `invited`, `disabled` |
| `invited_at` | timestamptz |  |

#### `channel_connections`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Foreign key |
| `provider` | enum | `facebook`, `whatsapp`, `instagram`, `website` |
| `external_page_id` | text | Meta Page/WABA/Instagram ID |
| `display_name` | text |  |
| `access_token_encrypted` | text | Encrypted token |
| `token_expires_at` | timestamptz |  |
| `status` | enum | `connected`, `error`, `disconnected` |
| `last_synced_at` | timestamptz |  |

#### `conversations`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Foreign key |
| `channel_connection_id` | UUID | Foreign key |
| `customer_id` | UUID | Foreign key |
| `external_thread_id` | text | Channel-specific thread/conversation ID |
| `status` | enum | `open`, `pending`, `escalated`, `closed` |
| `assignee_id` | UUID | Nullable foreign key |
| `ai_mode` | enum | `draft_only`, `assisted`, `autonomous` |
| `last_message_at` | timestamptz | Indexed |
| `first_response_at` | timestamptz |  |
| `sla_due_at` | timestamptz |  |
| `tags` | text[] |  |

#### `messages`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `conversation_id` | UUID | Foreign key |
| `direction` | enum | `inbound`, `outbound` |
| `sender_type` | enum | `customer`, `agent`, `ai`, `system` |
| `channel` | enum | `facebook`, `whatsapp`, `instagram`, `website` |
| `message_type` | enum | `text`, `image`, `file`, `audio`, `template`, `system` |
| `body` | text | Encrypted at rest if required by policy |
| `media_url` | text | Object-storage URL |
| `external_message_id` | text | Unique per channel |
| `ai_confidence` | numeric | Nullable |
| `ai_sources` | jsonb | Retrieved knowledge references |
| `status` | enum | `received`, `queued`, `sent`, `failed`, `read` |
| `sent_by_user_id` | UUID | Nullable |
| `created_at` | timestamptz | Indexed |

#### `customers`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Foreign key |
| `channel_customer_id` | text | Platform-specific ID |
| `name` | text |  |
| `phone` | text | Encrypted or tokenized where required |
| `email` | citext | Nullable |
| `lead_stage` | enum | `new`, `interested`, `price_sent`, `payment_pending`, `order_placed`, `delivered`, `returned`, `lost` |
| `metadata` | jsonb | Custom fields |
| `created_at` | timestamptz |  |

#### `products`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Foreign key |
| `title` | text |  |
| `description` | text |  |
| `price` | numeric |  |
| `currency` | text | Default `BDT` |
| `stock_status` | enum | `in_stock`, `out_of_stock`, `preorder` |
| `category` | text |  |
| `attributes` | jsonb | Size, color, material, etc. |
| `image_urls` | text[] |  |
| `external_id` | text | Catalog/source ID |
| `embedding_status` | enum | `pending`, `indexed`, `failed` |

#### `orders`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `workspace_id` | UUID | Foreign key |
| `customer_id` | UUID | Foreign key |
| `conversation_id` | UUID | Nullable foreign key |
| `status` | enum | `draft`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`, `returned` |
| `payment_method` | enum | `cod`, `bkash`, `nagad`, `bank_transfer`, `other` |
| `payment_status` | enum | `pending`, `paid`, `refunded`, `failed` |
| `subtotal` | numeric |  |
| `delivery_charge` | numeric |  |
| `total` | numeric |  |
| `delivery_area` | text |  |
| `shipping_address` | jsonb |  |
| `courier_status` | text | Nullable |
| `created_by` | enum | `merchant`, `agent`, `ai` |

#### `ai_suggestions`

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `conversation_id` | UUID | Foreign key |
| `message_id` | UUID | Nullable foreign key |
| `suggested_reply` | text |  |
| `intent` | text |  |
| `confidence` | numeric |  |
| `sources` | jsonb | Knowledge/document references |
| `status` | enum | `pending`, `approved`, `edited`, `rejected`, `expired` |
| `reviewed_by` | UUID | Nullable |
| `reviewed_at` | timestamptz |  |

---

## 6. Channel Integration Requirements

### 6.1 Facebook Messenger

- Use Meta Login for Business and Graph API to obtain Page-level permissions.
- Subscribe to Messenger webhook events for inbound messages, deliveries, and read receipts.
- Store Page access tokens encrypted.
- Support text, image, attachment, and postback events.
- Maintain a mapping between Meta Page ID, workspace, and conversation thread.
- Handle Meta token expiry and reauthorization flows.
- Respect Meta messaging windows and policy restrictions.

Meta webhooks require a public HTTPS endpoint with a valid TLS certificate; self-signed certificates are not supported.

### 6.2 WhatsApp Business Cloud API

- Use WhatsApp Business Cloud API with a Meta business portfolio and registered WhatsApp Business number.
- Support inbound text, media, and template message events.
- Support outbound session messages and approved template messages.
- Store WhatsApp phone-number ID, WABA ID, access token, and template metadata.
- Track messaging limits, quality rating, template status, and per-message cost where exposed by Meta.
- Prevent merchants from sending unauthorized marketing templates.
- Maintain delivery-status events: `sent`, `delivered`, `read`, and `failed`.

Meta signs webhook event payloads with HMAC-SHA256 and sends the signature in `X-Hub-Signature-256`. The signature must be calculated over the exact raw request body using the Meta app secret, then compared in constant time.

### 6.3 Instagram Messaging

- Support Instagram Professional accounts linked to a Facebook Page.
- Request and store required Meta permissions.
- Ingest direct-message events through Meta webhooks.
- Support text and media messages.
- Apply the same AI drafting, approval, escalation, and audit rules as Messenger.

### 6.4 Website Chat Widget

- Provide a JavaScript embed snippet:

```html
<script
  src="https://cdn.replyraja.com/widget.js"
  data-workspace="WORKSPACE_ID"
  defer
></script>
```

- Render a responsive chat launcher and widget.
- Support anonymous visitor sessions with a browser-generated visitor ID.
- Optionally identify logged-in website users through a signed JWT or server-side identity verification.
- Route website conversations into the same unified inbox.
- Support file/image attachments in v1.1.
- Enforce per-domain allowlists to prevent widget abuse.

---

## 7. Webhook Architecture

### 7.1 Webhook Endpoints

```text
POST /api/v1/webhooks/meta
GET  /api/v1/webhooks/meta/verify
POST /api/v1/webhooks/whatsapp
POST /api/v1/webhooks/instagram
POST /api/v1/webhooks/website/{workspace_id}
```

### 7.2 Meta Verification Handshake

For webhook registration, Meta sends:

```text
GET /api/v1/webhooks/meta
  ?hub.mode=subscribe
  &hub.verify_token=STORED_VERIFY_TOKEN
  &hub.challenge=CHALLENGE_VALUE
```

The service must:

1. Confirm `hub.mode` is `subscribe`.
2. Compare `hub.verify_token` with the stored verify token using constant-time comparison.
3. Return `hub.challenge` as plain text with HTTP 200.
4. Return HTTP 403 if verification fails.

### 7.3 Event Signature Validation

For every webhook POST:

1. Read the **raw request body** before JSON parsing.
2. Compute HMAC-SHA256 using the Meta app secret.
3. Compare it with `X-Hub-Signature-256: sha256=<hex>`.
4. Use constant-time comparison.
5. Reject invalid or missing signatures with HTTP 401.
6. Return HTTP 200 quickly after enqueueing valid events.
7. Process events asynchronously.

Do not re-serialize parsed JSON before signature verification; validation must use the original request bytes.

### 7.4 Idempotency and Retries

- Store `external_message_id`, event ID, or provider-specific message ID uniquely.
- Use database unique constraints or Redis-based deduplication keys.
- Meta may retry webhook deliveries; duplicate events must not create duplicate messages, orders, or AI suggestions.
- Use exponential backoff for outbound API failures.
- Move permanently failed events to a dead-letter queue with alerting.
- Process webhook batches asynchronously; do not block the webhook response on LLM generation.

---

## 8. AI Architecture

### 8.1 AI Pipeline

```text
Inbound message
   ↓
Normalize language and content
   ↓
Intent + risk classification
   ↓
Retrieve merchant knowledge
   ↓
Retrieve product/catalog context
   ↓
Construct prompt with rules + history
   ↓
LLM generates draft
   ↓
Guardrail validation
   ↓
Create AI suggestion
   ↓
Human approval or controlled auto-send
```

### 8.2 Language Handling

ReplyRaja must support:

- Bengali script
- Banglish, such as “ei jama ta M size e ache?”
- Mixed Bengali-English messages
- Common spelling variations
- Product names written in English with Bengali customer questions

The system must detect the customer’s language and respond in the same language by default, unless the merchant overrides the response language.

### 8.3 Retrieval-Augmented Generation

The AI must use retrieval-augmented generation (RAG), not rely only on the LLM’s general knowledge.

**Retrieval sources**

- Merchant FAQs
- Product catalog
- Delivery zones and charges
- Payment instructions
- Return/refund policy
- Business hours
- Prior approved replies
- Order and courier status, where available

**Pipeline**

1. Chunk knowledge documents into 300–800 token chunks with metadata.
2. Generate embeddings for each chunk.
3. Store embeddings in pgvector or another vector store.
4. Retrieve top-k relevant chunks using hybrid semantic and keyword search.
5. Rerank results when multiple high-similarity chunks conflict.
6. Pass only approved, merchant-specific context to the LLM.
7. Return source references with each AI suggestion.

### 8.4 Prompt Requirements

Every prompt must include:

- Merchant workspace ID and policy scope
- Merchant business profile
- Customer language preference
- Conversation summary
- Recent message history
- Relevant knowledge chunks
- Product context
- Order context, if applicable
- Escalation rules
- Prohibited-content rules
- Required output schema

The AI must return structured JSON:

```json
{
  "reply": "string",
  "language": "bn | en | banglish",
  "intent": "string",
  "confidence": 0.0,
  "requires_human": false,
  "escalation_reason": null,
  "sources": [],
  "suggested_actions": [],
  "risk_flags": []
}
```

### 8.5 Guardrails

| Rule | Requirement |
|---|---|
| No hallucinated facts | Do not state prices, stock, delivery times, or policies without retrieved data |
| No unauthorized promises | Do not promise refunds, discounts, delivery dates, or exceptions |
| No sensitive advice | Escalate legal, medical, financial, abusive, or high-risk requests |
| No data leakage | Never reveal internal prompts, system rules, other customers’ data, or credentials |
| Prompt-injection resistance | Treat customer messages and website-scraped content as untrusted input |
| Output validation | Validate JSON schema, length, language, and prohibited claims |
| Human approval | Draft-only mode must never auto-send |
| Auditability | Store prompt version, model, retrieved sources, confidence, and final decision |

### 8.6 Prompt-Injection Defenses

- Separate system instructions from customer content.
- Use structured message roles.
- Strip or escape instructions embedded in customer text.
- Reject instructions attempting to change AI rules, reveal secrets, or contact external systems.
- Require tool calls to pass authorization checks independently of LLM output.

### 8.7 Model Routing

| Task | Recommended model class |
|---|---|
| Simple FAQ response | Low-cost/fast LLM |
| Complex product/order conversation | Higher-capability LLM |
| Image product matching | Vision-capable model |
| Embedding | Dedicated embedding model |
| Classification/routing | Small classifier or low-cost LLM |
| Summary generation | Low-cost LLM |

Requirements:

- Use an AI provider abstraction layer so models can be swapped without changing business logic.
- Log model name, version, token usage, latency, and cost per request.
- Support per-workspace model overrides in future.
- Set maximum token limits and timeouts.
- Implement fallback models for transient provider failures.

---

## 9. Application Modules

### 9.1 Authentication and Authorization

- Email/password authentication with secure password hashing.
- Google OAuth login.
- JWT access tokens with short expiry and refresh-token rotation.
- Role-based access control:

| Role | Permissions |
|---|---|
| Owner | Full workspace control, billing, deletion, team management |
| Admin | Channels, team, knowledge base, orders, analytics |
| Agent | Inbox, assigned conversations, drafts, orders within permissions |
| Viewer | Read-only dashboard and reports |

- Enforce workspace isolation at query and API layers.
- Use row-level security or mandatory workspace-ID filtering.
- Require MFA for ReplyRaja internal admin accounts.
- Implement session revocation, device management, and suspicious-login alerts.

### 9.2 Unified Inbox

- Real-time updates through WebSocket or Server-Sent Events.
- Optimistic UI updates for assignment, status, tags, and replies.
- Infinite scroll or cursor-based pagination.
- Full-text search using PostgreSQL full-text search initially.
- Conversation timeline with inbound, outbound, AI, system, and internal-note events.
- Mobile-responsive layout.
- Unread indicators, assignment indicators, SLA timers, and escalation badges.

### 9.3 Knowledge Base

- CRUD APIs for FAQs, policies, business rules, delivery zones, and product data.
- CSV and Google Sheets import with validation and error reporting.
- Document upload for PDF, DOCX, TXT, and Markdown.
- Asynchronous ingestion pipeline:

```text
Upload → Parse → Clean → Chunk → Embed → Index → Ready
```

- Show ingestion status and failed-row errors.
- Support reindexing and rollback.
- Maintain a test-chat sandbox that does not send customer messages.

### 9.4 Orders

- Create orders from structured AI extraction or manual agent entry.
- Validate required fields before order confirmation.
- Calculate subtotal, delivery charge, and total.
- Support COD, bKash, Nagad, bank transfer, and other payment methods.
- Maintain an immutable order-status event history.
- Generate customer-facing order confirmation drafts.
- Export orders to CSV.
- Prevent duplicate order creation using customer phone, recent-order window, and product/quantity checks.

### 9.5 Analytics

- Use pre-aggregated tables or materialized views for dashboard performance.
- Track events through an internal event bus or analytics table:

```text
message_received
ai_suggestion_created
ai_suggestion_approved
ai_suggestion_rejected
message_sent
conversation_escalated
order_created
order_confirmed
followup_created
```

- Provide daily, weekly, and monthly views.
- Support workspace-level filtering and date-range selection.
- Separate operational metrics from financial metrics.
- Do not expose individual customer conversations in aggregate dashboards.

---

## 10. API Requirements

### 10.1 API Style

Use a versioned REST API:

```text
https://api.replyraja.com/v1/
```

Requirements:

- JSON request and response bodies.
- ISO 8601 timestamps in UTC.
- Cursor-based pagination.
- Consistent error format.
- Idempotency keys for order creation and outbound messaging.
- Rate limiting per IP, user, workspace, and API key.

### 10.2 Core Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Create account |
| `POST` | `/auth/login` | Authenticate user |
| `POST` | `/auth/refresh` | Refresh access token |
| `GET` | `/me` | Current user and workspace context |
| `POST` | `/workspaces` | Create workspace |
| `POST` | `/workspaces/{id}/members` | Invite team member |
| `POST` | `/channels/connect` | Start channel connection |
| `GET` | `/channels` | List connected channels |
| `GET` | `/conversations` | List/filter conversations |
| `GET` | `/conversations/{id}` | Get conversation detail |
| `POST` | `/conversations/{id}/messages` | Send approved message |
| `POST` | `/conversations/{id}/assign` | Assign agent |
| `POST` | `/conversations/{id}/escalate` | Escalate conversation |
| `POST` | `/ai/draft` | Generate AI draft |
| `POST` | `/ai/suggestions/{id}/approve` | Approve AI suggestion |
| `POST` | `/ai/suggestions/{id}/reject` | Reject AI suggestion |
| `GET` | `/products` | List products |
| `POST` | `/products/import` | Import catalog |
| `GET` | `/orders` | List orders |
| `POST` | `/orders` | Create order |
| `PATCH` | `/orders/{id}` | Update order |
| `GET` | `/analytics/overview` | Dashboard metrics |
| `POST` | `/webhooks/meta` | Receive Meta events |
| `POST` | `/webhooks/website/{workspace_id}` | Receive website-chat events |

### 10.3 Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Order address is required.",
    "field": "shipping_address",
    "request_id": "req_123"
  }
}
```

---

## 11. Security Requirements

ReplyRaja handles merchant credentials, customer conversations, order data, and AI-generated communications. Security controls should align with OWASP ASVS.

### 11.1 Application Security

| Area | Requirement |
|---|---|
| Transport | HTTPS everywhere; HSTS enabled; TLS 1.2+ preferred |
| Authentication | Secure password hashing with Argon2id or bcrypt |
| Sessions | Short-lived access tokens, rotating refresh tokens, secure HTTP-only cookies where applicable |
| Authorization | Server-side authorization on every request; no client-trusted roles |
| Input validation | Validate and sanitize all API, webhook, upload, and widget inputs |
| SQL injection | Use parameterized queries or ORM-safe query construction |
| XSS | Escape user-generated content; use a strict Content Security Policy |
| CSRF | Use CSRF protection for cookie-based browser flows |
| File uploads | Validate MIME type, extension, size, malware scanning, and isolated storage |
| Rate limiting | Apply limits to login, signup, AI, messaging, and public endpoints |
| Secrets | Store in a secrets manager; rotate regularly; never commit to Git |
| Dependencies | Automated dependency scanning and patch management |
| Headers | Implement CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` |

### 11.2 Data Protection

| Data type | Protection |
|---|---|
| Passwords | Argon2id/bcrypt hash; never reversible |
| Channel tokens | Encrypted with envelope encryption; key management through KMS |
| Customer phone numbers | Access-controlled; encrypted at rest where required |
| Conversation content | Encrypted at rest; role-based access |
| Payment data | Do not store raw card data; use PSP tokenization |
| AI prompts | Retain only as needed for debugging, with redaction and access controls |
| Backups | Encrypted, access-controlled, and restore-tested |

### 11.3 Audit Logging

Log:

- Login and failed-login attempts
- Password and MFA changes
- Channel connection/disconnection
- AI suggestion creation, approval, rejection, and auto-send
- Outbound message sends
- Order creation/modification
- Knowledge-base changes
- Role changes
- Data export and deletion requests

Audit logs must include actor ID, workspace ID, action, target resource, timestamp, IP, and request ID.

### 11.4 AI-Specific Security

- Validate all webhook signatures before processing.
- Treat customer messages as untrusted input.
- Prevent prompt injection from changing permissions or triggering unauthorized tool calls.
- Require explicit authorization before any tool call, such as creating an order or sending a message.
- Limit AI tool permissions using least privilege.
- Redact secrets and tokens from logs.
- Monitor abnormal AI usage, unusual escalation rates, and repeated jailbreak attempts.

---

## 12. Performance and Scalability

### 12.1 Performance Targets

| Operation | Target |
|---|---|
| Dashboard first load | Under 2.5 seconds on 4G |
| Inbox conversation load | Under 1 second for 95% of requests |
| AI draft generation | Under 5 seconds for 90% of requests |
| Webhook acknowledgment | Under 500 ms |
| Search results | Under 1 second for typical queries |
| Analytics dashboard | Under 3 seconds |

### 12.2 Scalability Design

- Stateless API servers behind a load balancer.
- Horizontal scaling for API and worker services.
- Redis-backed queues for AI, webhooks, emails, imports, and notifications.
- Database read replicas for reporting when needed.
- Cursor pagination instead of offset pagination for large inbox datasets.
- Indexed fields: `workspace_id`, `conversation_id`, `customer_id`, `status`, `created_at`, `external_message_id`.
- Partition high-volume `messages` and `audit_logs` tables by month when needed.
- Cache product lookups, workspace settings, and public marketing pages.

### 12.3 Launch Capacity Target

The MVP should support:

- 500 workspaces
- 50,000 conversations per month
- 250,000 messages per month
- 100 concurrent dashboard users
- 50 AI requests per minute sustained, with burst capacity to 150 requests per minute

---

## 13. Reliability and Observability

### 13.1 Availability

- Target 99.5% monthly uptime for core app and messaging APIs.
- Target 99.9% uptime for webhook ingestion.
- Use health checks for API, workers, database, Redis, and AI dependencies.
- Deploy across at least two availability zones where the cloud provider supports it.
- Use rolling deployments with automated rollback.

### 13.2 Monitoring

Monitor:

- API latency and error rate
- Webhook ingestion success/failure rate
- Queue depth and job failure rate
- AI latency, token usage, cost, and error rate
- Database CPU, connections, replication lag, and slow queries
- Redis memory and queue backlog
- Channel API quota usage
- Uptime of marketing site, dashboard, and widget

### 13.3 Alerting

Trigger alerts for:

- Webhook failure rate above 2% over 15 minutes
- AI error rate above 5% over 15 minutes
- Queue backlog above threshold
- Database connection saturation
- Expired channel tokens
- Repeated webhook signature failures
- Payment/billing failures
- Security events such as credential-stuffing patterns

---

## 14. Testing Requirements

### 14.1 Test Coverage

| Test type | Scope |
|---|---|
| Unit tests | Business logic, validators, pricing, permissions, AI response parsing |
| Integration tests | API endpoints, database, queues, auth, channel adapters |
| Contract tests | Meta webhook payload handling and outbound API requests |
| E2E tests | Signup, connect channel, receive message, draft, approve, send, create order |
| AI evaluation tests | Bengali, Banglish, English, ambiguous, adversarial, and out-of-scope questions |
| Load tests | Webhook bursts, inbox search, AI concurrency, dashboard usage |
| Security tests | Auth bypass, IDOR, injection, CSRF, XSS, privilege escalation, webhook spoofing |
| Accessibility tests | Keyboard navigation, screen-reader labels, contrast, mobile usability |

### 14.2 AI Evaluation Dataset

Create a labeled test set containing at least 300 examples:

- Product price questions
- Stock and size questions
- Delivery-charge questions
- COD and bKash/Nagad questions
- Order-status questions
- Complaints and refund requests
- Photo-based product identification
- Banglish and mixed-language messages
- Prompt-injection attempts
- Questions with missing merchant data

Measure:

- Answer accuracy
- Language correctness
- Hallucination rate
- Escalation precision/recall
- Human-edit distance
- Average latency
- Cost per conversation

---

## 15. Deployment and DevOps

### 15.1 CI/CD Pipeline

Every pull request must run:

1. Linting and type checking
2. Unit tests
3. Integration tests
4. Security dependency scan
5. Build
6. Preview deployment
7. Smoke tests

Merging to `main` must:

1. Run full test suite
2. Run database migrations
3. Build container images
4. Deploy to staging
5. Run E2E smoke tests
6. Require manual approval for production deployment

### 15.2 Deployment Requirements

- Immutable container images tagged by Git commit SHA.
- Blue/green or rolling deployment.
- Database migrations must be backward-compatible during deployment.
- Feature flags for risky AI and channel features.
- Configuration validation at startup.
- Centralized secrets management.
- Automated backups with tested restoration.

### 15.3 Disaster Recovery

| Item | Requirement |
|---|---|
| Database backup frequency | At least daily, with point-in-time recovery where available |
| Backup retention | Minimum 30 days |
| Recovery time objective | Under 4 hours |
| Recovery point objective | Under 15 minutes |
| DR test | Quarterly restore test |

---

## 16. Compliance and Platform Requirements

- Use official Meta/WhatsApp APIs; do not use unofficial browser automation or reverse-engineered WhatsApp clients.
- Comply with Meta Platform Terms, WhatsApp Business Terms, messaging policies, and commerce policies.
- Use HTTPS endpoints with valid certificates for all webhook integrations.
- Validate webhook authenticity using `X-Hub-Signature-256` and constant-time comparison.
- Implement data-subject rights: access, correction, export, deletion, and channel disconnection.
- Review Bangladesh Personal Data Protection Ordinance 2025 obligations before public launch.
- Maintain records of processing purposes, retention periods, subprocessors, and AI providers.

---

## 17. MVP Delivery Checklist

### Must Be Complete Before Public Beta

- [ ] Merchant signup, login, workspace creation, and role management
- [ ] Facebook Messenger connection and webhook ingestion
- [ ] WhatsApp Cloud API connection and webhook ingestion
- [ ] Unified inbox with assignment, statuses, notes, and search
- [ ] AI draft generation with human approval
- [ ] Knowledge base with FAQ, product, policy, and delivery-rule ingestion
- [ ] Product catalog import
- [ ] RAG-based answer generation with source references
- [ ] Escalation rules and low-confidence handling
- [ ] Lead capture and customer profiles
- [ ] Order creation and order-status workflow
- [ ] Basic analytics dashboard
- [ ] Bengali and English UI
- [ ] Marketing website, pricing page, and demo request flow
- [ ] Privacy policy, terms, and data-deletion workflow
- [ ] Audit logs
- [ ] Webhook signature validation and idempotency
- [ ] Monitoring, alerting, backups, and CI/CD
- [ ] AI evaluation suite with Bengali/Banglish test cases
- [ ] Load and security testing

---

## 18. Acceptance Criteria

ReplyRaja v1 is accepted when:

1. A merchant can sign up, connect Facebook and WhatsApp, and receive a customer message in the unified inbox.
2. ReplyRaja generates a Bengali or Banglish AI reply draft using merchant-approved knowledge.
3. An agent can review, edit, approve, and send the draft.
4. The system escalates refund, complaint, high-risk, and low-confidence conversations.
5. A merchant can create an order from a conversation and view it in the orders module.
6. Duplicate webhook events do not create duplicate messages or orders.
7. All Meta webhook requests are signature-verified and processed asynchronously.
8. The dashboard displays conversations, response times, AI usage, escalations, and orders created.
9. Merchants can export data, disconnect channels, and request account/conversation deletion.
10. The platform passes security, load, AI-evaluation, and end-to-end acceptance tests.

---

## 19. Future Technical Roadmap

| Phase | Feature | Technical focus |
|---|---|---|
| v1.1 | Instagram and website chat | Additional channel adapters and widget SDK |
| v1.2 | Chrome extension | Secure extension auth and Meta Business Suite DOM integration |
| v1.3 | Courier integrations | Courier webhooks, status normalization, delivery notifications |
| v1.4 | Autonomous AI mode | Intent allowlists, confidence thresholds, simulation mode, stronger guardrails |
| v1.5 | Agency platform | Multi-workspace architecture, consolidated reporting, white-labeling |
| v2.0 | Public API and marketplace | Developer keys, webhooks, app ecosystem, custom integrations |
