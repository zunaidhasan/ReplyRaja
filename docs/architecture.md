# ReplyRaja — System Architecture

**Product:** ReplyRaja  
**Version:** 1.0  
**Date:** October 11, 2026  
**Owner:** Zunaid Ishan  
**Status:** Ready for engineering review  
**Related documents:** `PRD.md`, `TRD.md`, `ROADMAP.md`

---

## 1. Architecture Principles

ReplyRaja is designed as a modular, multi-tenant SaaS platform for AI-assisted customer conversations and sales workflows.

The architecture follows these principles:

1. **Multi-tenant by default:** Every merchant operates in an isolated workspace.
2. **Human-in-the-loop first:** AI drafts replies; humans approve unless controlled automation is explicitly enabled.
3. **Channel-agnostic core:** Facebook, WhatsApp, Instagram, and website chat use a common conversation model.
4. **Retrieval-grounded AI:** The AI answers from merchant-approved knowledge, products, policies, and order data—not general model memory.
5. **Asynchronous processing:** Webhooks, AI generation, imports, notifications, and follow-ups run through durable queues.
6. **Secure by design:** Workspace isolation, least-privilege access, encrypted secrets, audit logs, and webhook verification are mandatory.
7. **Provider-agnostic AI:** LLM, embedding, and vision providers can be replaced without rewriting business logic.
8. **Mobile-first operations:** Merchants and agents must be able to manage conversations from phones.

---

## 2. Context Diagram

```text
┌──────────────┐        ┌──────────────────┐
│   Customer   │───────▶│ Messaging Channel │
└──────────────┘        └─────────┬────────┘
                                  │
                 Facebook / WhatsApp / Instagram / Website
                                  │
                                  ▼
                      ┌───────────────────┐
                      │    ReplyRaja      │
                      │  SaaS Platform    │
                      └─────────┬─────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
     ┌──────────────┐  ┌────────────────┐  ┌──────────────┐
     │ Merchant /   │  │  AI Providers  │  │ Courier /     │
     │ Support Agent│  │  LLM / Vision  │  │ Payment Tools │
     └──────────────┘  └────────────────┘  └──────────────┘
```

### Actors

| Actor | Interaction |
|---|---|
| End customer | Sends messages and product photos through a connected channel |
| Merchant owner | Configures workspace, products, policies, AI rules, team, and billing |
| Support agent | Reviews conversations, sends replies, manages leads and orders |
| Agency/admin | Manages multiple merchant workspaces and reports |
| ReplyRaja internal team | Monitors reliability, supports merchants, manages platform administration |
| AI provider | Generates embeddings, drafts, classifications, and image matches |
| Meta | Delivers Facebook, Instagram, and WhatsApp webhook events |
| Courier provider | Sends delivery-status updates through API/webhook integrations |

---

## 3. High-Level Architecture

```text
                        ┌────────────────────────────┐
                        │        Customer             │
                        └─────────────┬──────────────┘
                                      │
        ┌──────────────┬──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼              ▼
┌──────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│  Facebook    │ │  WhatsApp  │ │ Instagram  │ │  Website   │ │  Chrome    │
│  Messenger   │ │  Cloud API │ │ Messaging  │ │ Chat Widget│ │ Extension  │
└──────┬───────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
       │               │              │              │              │
       └───────────────┴──────┬───────┴──────────────┘              │
                              ▼                                     │
                    ┌───────────────────┐                           │
                    │  Channel Gateway  │◀--------------------------┘
                    │ Webhooks + Adapters│
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │    API Gateway    │
                    │ Auth / Rate Limit │
                    └─────────┬─────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Core API    │    │  AI Orchestrator │    │  Background Jobs │
│ Inbox / CRM  │    │ RAG / Guardrails │    │ Queue / Workers  │
│ Orders / KB  │    └────────┬─────────┘    └──────────────────┘
└──────┬───────┘             │
       │                     ▼
       │           ┌───────────────────┐
       │           │   AI Providers    │
       │           │ LLM / Embeddings  │
       │           │ Vision / Reranker │
       │           └───────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│                Data Layer                    │
│ PostgreSQL + pgvector | Redis | Object Store │
└─────────────────────────────────────────────┘
```

---

## 4. Service Architecture

### 4.1 Service Boundaries

| Service | Core responsibility | Primary consumers |
|---|---|---|
| Web App | Merchant dashboard, inbox, settings, CRM, orders, analytics | Merchant owner, agent, admin |
| Core API | Authentication, authorization, business workflows, data access | Web app, Chrome extension, integrations |
| Channel Gateway | Receives channel events, validates webhooks, normalizes messages | Meta, website widget |
| AI Orchestrator | Builds context, retrieves knowledge, generates drafts, applies guardrails | Core API, workers |
| Knowledge Service | Ingests and indexes FAQs, products, policies, and documents | Merchant, AI Orchestrator |
| Order Service | Creates and manages orders, payment status, and courier status | Core API, AI Orchestrator |
| Notification Service | Sends email, in-app alerts, escalation notices, and reminders | Core API, workers |
| Billing Service | Manages plans, trials, usage, invoices, and payment status | Merchant, Core API |
| Admin Service | Internal support, workspace administration, impersonation controls | ReplyRaja internal team |
| Extension API | Provides customer context and drafts to the Chrome extension | Chrome extension |

### 4.2 Recommended Deployment Shape

For the MVP, deploy the platform as a **modular monolith with separate worker processes**, rather than immediately splitting every service into a microservice.

```text
replyraja-web         → Next.js frontend
replyraja-api         → Core API service
replyraja-worker      → Queue workers
replyraja-ai-worker   → AI/RAG workers
replyraja-scheduler   → Cron and reminder jobs
replyraja-widget      → Website chat widget bundle/CDN
```

This reduces early operational complexity while preserving clear module boundaries for future extraction into separate services.

---

## 5. Request Flows

### 5.1 Inbound Facebook Message

```text
1. Customer sends a Messenger message.
2. Meta delivers a signed webhook event to ReplyRaja.
3. Channel Gateway validates HMAC signature and verify token.
4. Gateway enqueues a normalized channel event.
5. Worker deduplicates the event using external_message_id.
6. Worker creates/updates customer, conversation, and message records.
7. Worker requests an AI draft from the AI Orchestrator.
8. AI Orchestrator retrieves merchant knowledge and product context.
9. LLM generates a structured draft response.
10. Guardrails validate output, confidence, language, and escalation rules.
11. ReplyRaja stores the AI suggestion.
12. Agent reviews, edits, and sends the reply.
13. Core API sends the approved message through the channel adapter.
14. Delivery status is updated asynchronously.
```

### 5.2 Product Photo Identification

```text
1. Customer uploads a product photo.
2. Channel Gateway stores the media in object storage.
3. Worker creates a vision-analysis job.
4. Vision model returns candidate product attributes or embeddings.
5. Knowledge Service searches the merchant product catalog.
6. AI Orchestrator ranks likely matches using image, text, and catalog signals.
7. ReplyRaja returns matching products to the conversation.
8. Customer selects a product.
9. AI collects order details and creates a draft order.
```

### 5.3 Human Escalation

```text
1. Customer requests a refund or complains about a damaged product.
2. Intent/risk classifier marks the conversation as high-risk.
3. AI Orchestrator applies escalation rules.
4. Conversation status changes to escalated.
5. Notification Service alerts the assigned agent or workspace admins.
6. Agent opens the full conversation context and responds manually.
7. Audit log records the escalation reason and human action.
```

### 5.4 Knowledge-Base Ingestion

```text
1. Merchant uploads a CSV, Google Sheet, PDF, DOCX, or FAQ entry.
2. Core API creates an ingestion job.
3. Worker parses and cleans the content.
4. Worker chunks content into retrievable units.
5. Embedding provider creates vectors.
6. Worker stores vectors and metadata in pgvector.
7. Knowledge Service marks the source as indexed.
8. Merchant can test the assistant in sandbox mode.
```

---

## 6. Multi-Tenancy Model

### 6.1 Tenant Isolation

Every merchant is represented by a `workspace`. All business data must include a `workspace_id` and be scoped by it.

```text
Workspace
 ├── Users and roles
 ├── Channel connections
 ├── Conversations and messages
 ├── Customers and leads
 ├── Products and knowledge base
 ├── Orders and courier updates
 ├── AI configurations
 ├── Billing and usage
 └── Audit logs
```

### 6.2 Isolation Controls

| Control | Requirement |
|---|---|
| API authorization | Every request resolves the caller’s workspace membership |
| Database queries | Mandatory workspace filtering on every tenant-owned query |
| Row-level security | Preferred for PostgreSQL-backed core tables |
| File storage | Object keys prefixed with `workspace/{workspace_id}/` |
| Vector search | Metadata filter by `workspace_id` before similarity search |
| Background jobs | Job payload includes `workspace_id`; worker revalidates access |
| Cache keys | Include workspace ID in every cache key |
| Admin access | Internal impersonation requires explicit authorization and audit logging |

---

## 7. Data Architecture

### 7.1 Data Stores

| Store | Purpose | Examples |
|---|---|---|
| PostgreSQL | System of record | Users, workspaces, conversations, messages, orders |
| pgvector | Semantic retrieval | FAQ chunks, product descriptions, policy chunks |
| Redis | Ephemeral state and queues | Rate limits, job queues, locks, caches |
| Object storage | Media and files | Product images, attachments, imports, exports |
| Analytics store | Reporting and aggregates | Conversation, AI, order, and agent metrics |

### 7.2 Core Data Ownership

| Domain | Owner service | Main tables |
|---|---|---|
| Identity and access | Core API | `users`, `workspaces`, `workspace_members` |
| Channels | Channel Gateway | `channel_connections`, `messages` |
| Conversations | Core API | `conversations`, `messages`, `ai_suggestions` |
| CRM | Core API | `customers`, `lead_stage_history`, `follow_up_tasks` |
| Commerce | Order Service | `products`, `orders`, `order_items` |
| Knowledge | Knowledge Service | `knowledge_documents`, `knowledge_chunks` |
| Billing | Billing Service | `subscriptions`, `usage_events`, `invoices` |
| Compliance | Core API | `audit_logs`, `data_requests` |

### 7.3 Data Retention

| Data type | Default retention |
|---|---|
| Active conversation data | Retained while workspace is active |
| Closed conversation data | Retained according to merchant/workspace policy |
| AI prompts and raw model output | Retained only for debugging, subject to redaction and access controls |
| Audit logs | Minimum 12 months, subject to legal requirements |
| Deleted workspace data | Hard-deleted or anonymized after retention/export window |
| Backups | Minimum 30 days, encrypted and access-controlled |

---

## 8. AI Architecture

### 8.1 AI Components

```text
┌──────────────────────────────────────────────┐
│                AI Orchestrator                │
├──────────────────────────────────────────────┤
│ Language detector                             │
│ Intent classifier                             │
│ Risk/escalation classifier                    │
│ Context builder                               │
│ Retrieval client                              │
│ Reranker                                      │
│ Prompt builder                                │
│ LLM client                                    │
│ Vision client                                 │
│ Output validator                              │
│ Guardrail engine                              │
│ Tool authorization service                    │
└──────────────────────────────────────────────┘
```

### 8.2 Retrieval Flow

```text
Customer message
      ↓
Language + intent detection
      ↓
Query construction
      ↓
Hybrid retrieval
      ├── Keyword search
      └── Vector similarity search
      ↓
Workspace metadata filter
      ↓
Reranking
      ↓
Top-k approved knowledge chunks
      ↓
Prompt construction
      ↓
LLM draft
```

### 8.3 AI Response Contract

Every AI response must conform to this contract:

```json
{
  "reply": "এই জামাটি M সাইজে আছে। ঢাকার ভেতরে ডেলিভারি চার্জ ৬০ টাকা।",
  "language": "bn",
  "intent": "product_availability_and_delivery",
  "confidence": 0.92,
  "requires_human": false,
  "escalation_reason": null,
  "sources": [
    {
      "type": "product",
      "id": "prod_123",
      "title": "Cotton Shirt"
    },
    {
      "type": "knowledge_document",
      "id": "doc_456",
      "title": "Delivery Policy"
    }
  ],
  "suggested_actions": [
    {
      "action": "create_order_draft",
      "payload": {
        "product_id": "prod_123",
        "variant": "M"
      }
    }
  ],
  "risk_flags": []
}
```

### 8.4 Guardrail Layers

| Layer | Purpose |
|---|---|
| Input guardrails | Detect prompt injection, abuse, and unsupported requests |
| Retrieval guardrails | Restrict results to the merchant workspace and approved sources |
| Generation guardrails | Prevent unsupported factual claims and unauthorized promises |
| Output guardrails | Validate schema, language, length, and prohibited claims |
| Action guardrails | Require authorization before creating orders or sending messages |
| Human-control guardrails | Prevent auto-send in draft-only mode |
| Audit guardrails | Record model, prompt version, sources, confidence, and decision |

---

## 9. Integration Architecture

### 9.1 Channel Adapter Pattern

Each messaging channel uses an adapter with a common interface:

```text
Channel Adapter Interface
 ├── verifyWebhook()
 ├── parseEvent()
 ├── normalizeMessage()
 ├── sendMessage()
 ├── getDeliveryStatus()
 └── refreshToken()
```

```text
Meta Webhook → Facebook Adapter → Normalized Event → Core Queue
WhatsApp Event → WhatsApp Adapter → Normalized Event → Core Queue
Instagram Event → Instagram Adapter → Normalized Event → Core Queue
Website Event → Website Adapter → Normalized Event → Core Queue
```

This prevents channel-specific logic from leaking into the inbox, CRM, AI, or order modules.

### 9.2 Outbound Message Flow

```text
Agent approves reply
        ↓
Core API validates permission and channel rules
        ↓
Outbound message job enqueued
        ↓
Channel adapter formats provider-specific payload
        ↓
Provider API called
        ↓
Delivery status tracked
        ↓
Message status updated
```

### 9.3 Third-Party Failures

| Failure | Handling |
|---|---|
| Meta webhook retry | Deduplicate using event/message ID |
| Channel API timeout | Retry with exponential backoff |
| AI provider outage | Use fallback model or place conversation in human-only queue |
| Embedding failure | Mark source as failed and alert merchant |
| Payment webhook failure | Retry and reconcile using idempotency key |
| Courier API failure | Retain last known status and retry asynchronously |

---

## 10. Security Architecture

### 10.1 Security Zones

```text
Public Zone
 ├── Marketing website
 ├── Login/signup
 ├── Website chat widget
 └── Provider webhooks

Application Zone
 ├── Merchant dashboard
 ├── Core API
 ├── AI Orchestrator
 └── Background workers

Restricted Zone
 ├── Internal admin panel
 ├── Secrets manager
 ├── Database administration
 └── Observability tooling
```

### 10.2 Authentication and Authorization

- Browser sessions use short-lived access tokens and rotating refresh tokens.
- API clients use scoped API keys or OAuth tokens.
- Every API request must verify identity, workspace membership, role, and resource ownership.
- Role-based access control is enforced server-side.
- Internal admin access requires MFA, approval workflows, and audit logging.
- Chrome extension tokens must be scoped, short-lived, and revocable.

### 10.3 Webhook Security

- Use HTTPS-only endpoints with valid TLS certificates.
- Validate `X-Hub-Signature-256` using HMAC-SHA256 over the raw request body.
- Use constant-time signature comparison.
- Validate provider-specific verify tokens during registration.
- Reject unsigned, malformed, or replayed events.
- Return fast acknowledgments and process events asynchronously.

### 10.4 Secrets and Encryption

| Asset | Protection |
|---|---|
| Database credentials | Secrets manager, least-privilege IAM |
| Meta access tokens | Envelope encryption and KMS-managed keys |
| Customer PII | Encryption at rest, role-based access, redaction in logs |
| AI API keys | Secrets manager, rotation, usage monitoring |
| Backups | Encrypted, access-controlled, restore-tested |
| Logs | Secret redaction and retention limits |

---

## 11. Scalability Architecture

### 11.1 Scaling Strategy

| Component | Scaling approach |
|---|---|
| Web frontend | CDN + static/edge rendering |
| Core API | Stateless horizontal scaling behind load balancer |
| AI workers | Queue-based horizontal scaling |
| Webhook ingestion | Separate high-availability ingestion service |
| PostgreSQL | Vertical scaling first, then read replicas and partitioning |
| Redis | Managed Redis with cluster/replica configuration |
| Object storage | CDN-backed media delivery |
| Analytics | Materialized views and pre-aggregated tables |

### 11.2 Performance Targets

| Operation | Target |
|---|---|
| Webhook acknowledgment | Under 500 ms |
| Inbox conversation load | Under 1 second for 95% of requests |
| AI draft generation | Under 5 seconds for 90% of requests |
| Dashboard first load | Under 2.5 seconds on 4G |
| Search results | Under 1 second |
| Analytics dashboard | Under 3 seconds |

### 11.3 Capacity Target for MVP

- 500 workspaces
- 50,000 conversations per month
- 250,000 messages per month
- 100 concurrent dashboard users
- 50 sustained AI requests per minute
- 150 AI requests per minute burst capacity

---

## 12. Observability Architecture

### 12.1 Telemetry

Collect:

- Structured application logs
- Distributed traces across API, workers, AI, and channel adapters
- Metrics for latency, errors, saturation, and traffic
- AI-specific metrics: model, tokens, cost, latency, confidence, escalation rate
- Business events: message received, draft approved, order created, conversation escalated

### 12.2 Critical Alerts

| Alert | Threshold |
|---|---|
| Webhook failure rate | Above 2% for 15 minutes |
| AI error rate | Above 5% for 15 minutes |
| Queue backlog | Above defined workspace threshold |
| Database saturation | CPU, connections, or replication lag threshold |
| Expired channel token | Any production connection |
| Repeated signature failures | Potential spoofing or misconfiguration |
| Billing failure | Any failed payment reconciliation |

### 12.3 Request Tracing

Every inbound webhook and API request receives a `request_id`. The ID must propagate through:

```text
API Gateway → Core API → Queue → Worker → AI Service → Channel Adapter
```

This enables end-to-end debugging of a customer conversation, AI draft, approval, and outbound message.

---

## 13. Deployment Architecture

### 13.1 Recommended MVP Deployment

```text
Cloud DNS / CDN
       │
       ├── Marketing site
       ├── Web application
       ├── API endpoint
       └── Website widget assets
                │
                ▼
       Load Balancer / API Gateway
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
  Web/API   Workers   AI Workers
       │        │        │
       └────────┼────────┘
                ▼
   PostgreSQL + Redis + Object Storage
```

### 13.2 Deployment Requirements

- Containerized services with immutable images.
- Separate staging and production environments.
- Infrastructure as Code for repeatable provisioning.
- Automated database migrations with backward compatibility.
- Feature flags for AI automation and new channel integrations.
- Rolling or blue/green deployments.
- Automated rollback on failed health checks.
- Daily encrypted backups with tested restore procedures.

---

## 14. Architecture Decision Records

### ADR-001: Modular monolith first

**Decision:** Build ReplyRaja as a modular monolith with separate API and worker processes.

**Reason:** It reduces early infrastructure complexity while retaining clear domain boundaries.

**Consequence:** Services can be extracted later when scale, team size, or independent deployment needs justify it.

### ADR-002: PostgreSQL + pgvector for MVP

**Decision:** Use PostgreSQL with pgvector as the initial vector store.

**Reason:** It minimizes operational overhead and keeps transactional and vector data close together.

**Consequence:** Migrate to Qdrant, Pinecone, or another dedicated vector database if embedding scale or retrieval performance requires it.

### ADR-003: Human-approved AI by default

**Decision:** Default AI mode is draft-only; merchants must explicitly enable assisted or autonomous automation.

**Reason:** It builds trust, reduces incorrect-message risk, and aligns with the product’s control-first positioning.

**Consequence:** Autonomous features require stricter evaluation, guardrails, audit logs, and merchant-level permissions.

### ADR-004: Provider-agnostic AI layer

**Decision:** Use an abstraction layer for LLM, embedding, vision, and reranking providers.

**Reason:** AI pricing, quality, and availability change frequently.

**Consequence:** The platform can switch providers or route tasks to different models without rewriting core business logic.

### ADR-005: Official Meta APIs only

**Decision:** Use official Meta Graph API and WhatsApp Business Cloud API integrations.

**Reason:** Unofficial automation creates account, security, reliability, and compliance risks.

**Consequence:** Channel features must follow Meta policies, permissions, messaging windows, and webhook requirements.

---

## 15. Future Architecture Evolution

| Phase | Architectural change | Trigger |
|---|---|---|
| v1.1 | Dedicated website-widget service | Multiple widget customers and high chat volume |
| v1.2 | Separate Chrome extension backend | Extension-specific traffic and security requirements |
| v1.3 | Courier integration service | Multiple courier providers and webhook normalization |
| v1.4 | AI evaluation and prompt-management service | More models, prompts, languages, and merchant customization |
| v1.5 | Agency multi-workspace service | Agency-scale reporting, permissions, and white-label needs |
| v2.0 | Public developer platform | API customers, app marketplace, custom integrations |
