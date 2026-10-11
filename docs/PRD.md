# ReplyRaja — Product Requirements Document (PRD)

**Product:** ReplyRaja  
**Version:** 1.0  
**Date:** October 11, 2026  
**Owner:** Zunaid Ishan  
**Status:** Ready for internal/agency review  
**Related document:** `ReplyRaja-TRD.md`

---

## 1. Executive Summary

ReplyRaja is an AI-powered customer-conversation and sales-assistant platform for small and medium online businesses in Bangladesh. It helps merchants respond faster across Facebook Messenger, WhatsApp, Instagram, and website chat, capture more orders, follow up with interested customers, and hand complex conversations to human agents.

The product’s core differentiation is **controlled AI**: by default, ReplyRaja drafts replies for human approval. Merchants can gradually enable automation for approved question types while retaining escalation rules, audit trails, and full control over customer communication.

### Primary Promise

> **AI that turns customer messages into orders.**

### Bangla Promise

> **রিপ্লাইরাজা — কাস্টমারের মেসেজকে অর্ডারে পরিণত করুন।**

---

## 2. Problem Statement

Bangladeshi online sellers receive a high volume of repetitive customer messages across Facebook, Instagram, WhatsApp, and their websites. Common questions include product price, availability, size, color, delivery charge, payment method, order status, and return policy.

Many merchants cannot respond quickly outside business hours. As a result, they lose potential orders, spend excessive time on repetitive replies, and struggle to follow up with interested customers.

Existing chatbot tools often feel generic, English-first, difficult to configure, and risky because they may send incorrect answers automatically. Merchants need a Bengali-first assistant that understands local buying behavior and keeps humans in control.

---

## 3. Goals and Success Metrics

### 3.1 Business Goals

| Goal | Target for first 6 months after launch |
|---|---|
| Acquire design-partner merchants | 25 active merchants |
| Convert trial users to paid plans | 15% trial-to-paid conversion |
| Retain paying merchants | 80% monthly logo retention |
| Demonstrate measurable ROI | At least 20% improvement in response time or order capture for active accounts |
| Build channel coverage | Facebook Messenger, WhatsApp, Instagram, and website chat |

### 3.2 Product Success Metrics

| Metric | Definition | Target |
|---|---|---|
| Time to first value | Time from signup to first AI-drafted reply | Under 48 hours |
| First-response time | Median time from customer message to merchant/AI response | Under 5 minutes |
| AI draft acceptance rate | Percentage of AI drafts edited minimally or sent unchanged | Over 60% |
| Human takeover rate | Percentage of conversations escalated to a human | Track and reduce over time without hurting quality |
| Orders created from chat | Orders created through ReplyRaja | Growth month over month |
| Missed-message rate | Customer messages unanswered after 24 hours | Under 5% |
| Weekly active merchants | Merchants using inbox or AI features weekly | Over 60% of activated accounts |

---

## 4. Target Users

### 4.1 Primary User: Merchant Owner

A small e-commerce or F-commerce seller using Facebook, Instagram, WhatsApp, or a website to sell products.

**Needs**

- Fast Bengali/Banglish replies
- Product, price, stock, and delivery answers
- Order capture
- Human control over AI messages
- Simple setup without technical skills

### 4.2 Secondary User: Support Agent

A staff member handling customer conversations on behalf of the merchant.

**Needs**

- Customer history and context
- Suggested replies
- Order details
- Follow-up reminders
- Clear escalation alerts

### 4.3 Tertiary User: Agency/Admin

An agency managing multiple merchant pages or a business owner managing multiple brands.

**Needs**

- Multi-workspace management
- Team roles and permissions
- Consolidated reporting
- Client onboarding tools

### 4.4 End Customer

A shopper messaging the business in Bangla, Banglish, or English.

**Needs**

- Quick, accurate answers
- Clear product and delivery information
- Easy order process
- Human help for complex issues

---

## 5. Scope

### 5.1 In Scope for v1

- Merchant dashboard and unified inbox
- Facebook Messenger integration
- WhatsApp Business Cloud API integration
- AI reply drafting with human approval
- Knowledge base for FAQs, products, policies, and delivery rules
- Product catalog import
- Product photo recognition
- Lead capture and customer profiles
- Order creation
- Basic analytics
- Role-based team access
- Bengali and English interface
- Marketing website, pricing page, onboarding flow, and legal pages

### 5.2 In Scope for v1.1

- Instagram messaging
- Website live-chat widget
- Chrome extension for Meta Business Suite
- Automated replies for approved intents
- Follow-up reminders and scheduled follow-ups
- Courier-status updates
- Advanced analytics
- Agency workspaces

### 5.3 Out of Scope for v1

- Voice-call automation
- Fully autonomous outbound marketing campaigns
- Social-media content generation
- Native mobile apps
- Multi-language support beyond Bengali and English
- ERP/accounting integrations
- Custom on-premise deployment

---

## 6. Product Principles

1. **Human control first:** AI should assist, not take over unexpectedly.
2. **Bengali-first:** The product must work naturally with Bangla, Banglish, and mixed-language messages.
3. **Sales-oriented:** Every feature should help convert conversations into orders or retained customers.
4. **Fast time-to-value:** Merchants should see value within 48 hours.
5. **Trustworthy:** Merchants must understand what AI did, why it responded, and when a human intervened.
6. **Mobile-friendly:** Merchants should be able to manage chats from a phone.
7. **Privacy-respecting:** Customer data must not be sold or used for unrelated advertising.

---

## 7. User Journeys

### 7.1 Merchant Onboarding

1. Merchant creates an account.
2. Merchant connects a Facebook Page and/or WhatsApp Business number.
3. Merchant imports products through CSV, Google Sheets, or manual entry.
4. Merchant adds FAQs, delivery zones, payment methods, and business policies.
5. Merchant selects reply mode: **Draft only**, **Assisted auto-reply**, or **Autonomous**.
6. Merchant tests the assistant in sandbox mode.
7. Merchant goes live and begins receiving AI-drafted replies.
8. Merchant reviews performance after the first week.

**Success condition:** A non-technical merchant can complete setup and receive their first useful AI draft within 48 hours.

### 7.2 Customer Asks About a Product

1. Customer sends a Facebook message: “এই জামা টা কি M size এ আছে? ডেলিভারি চার্জ কত?”
2. ReplyRaja identifies the product, checks catalog data, and retrieves relevant policy information.
3. ReplyRaja creates a Bengali reply draft with price, size availability, and delivery charge.
4. Agent reviews and sends the reply, or the merchant has enabled auto-reply for this intent.
5. ReplyRaja logs the interaction and updates the customer profile.

**Success condition:** The customer receives an accurate answer quickly, and the merchant can complete the interaction in one screen.

### 7.3 Customer Sends a Product Photo

1. Customer uploads a photo of a product.
2. ReplyRaja uses vision AI to identify likely catalog matches.
3. ReplyRaja presents matching products, prices, variants, and availability.
4. Customer selects a product.
5. ReplyRaja collects name, phone, address, quantity, variant, and delivery information.
6. ReplyRaja creates a draft order for merchant confirmation.

**Success condition:** Photo-based inquiries convert into structured order leads rather than getting lost in the inbox.

### 7.4 Human Takeover

1. Customer asks for a refund or complains about a damaged product.
2. ReplyRaja detects a high-risk intent or low-confidence answer.
3. The conversation is escalated to a human agent.
4. The agent sees the full chat history, customer profile, order details, and AI reasoning.
5. The agent responds directly.

**Success condition:** No high-risk conversation is automatically answered without human oversight.

---

## 8. Functional Requirements

### 8.1 Authentication and Workspace

| ID | Requirement | Priority |
|---|---|---|
| AUTH-01 | Users can sign up with email/password and Google login. | P0 |
| AUTH-02 | Users can log in, reset passwords, and log out. | P0 |
| AUTH-03 | Each merchant has an isolated workspace. | P0 |
| AUTH-04 | System supports roles: Owner, Admin, Agent, Viewer. | P0 |
| AUTH-05 | Owners can invite/remove team members and assign roles. | P0 |
| AUTH-06 | All sensitive actions are audit-logged. | P0 |

### 8.2 Channel Connections

| ID | Requirement | Priority |
|---|---|---|
| CH-01 | Merchants can connect a Facebook Page through Meta authentication. | P0 |
| CH-02 | Merchants can connect WhatsApp through WhatsApp Business Cloud API. | P0 |
| CH-03 | Merchants can connect Instagram Professional accounts in v1.1. | P1 |
| CH-04 | Merchants can install a website chat widget in v1.1. | P1 |
| CH-05 | Merchants can disconnect a channel and delete associated conversation data. | P0 |
| CH-06 | System handles webhook retries, failures, and rate limits. | P0 |
| CH-07 | System displays connection health and error messages clearly. | P0 |

### 8.3 Unified Inbox

| ID | Requirement | Priority |
|---|---|---|
| INBOX-01 | All customer conversations appear in one inbox. | P0 |
| INBOX-02 | Each conversation shows channel, customer name, status, assignee, and latest message. | P0 |
| INBOX-03 | Agents can filter by channel, status, assignee, tag, order status, and unread state. | P0 |
| INBOX-04 | Agents can assign, reassign, snooze, close, and reopen conversations. | P0 |
| INBOX-05 | Agents can add internal notes invisible to customers. | P0 |
| INBOX-06 | System supports tags and custom conversation labels. | P1 |
| INBOX-07 | Inbox is fully usable on mobile browsers. | P0 |
| INBOX-08 | Agents can search conversations by customer name, phone, message text, order ID, or product. | P0 |

### 8.4 AI Reply Assistant

| ID | Requirement | Priority |
|---|---|---|
| AI-01 | AI can generate reply drafts in Bengali, Banglish, and English. | P0 |
| AI-02 | AI uses merchant knowledge base, product catalog, and conversation context. | P0 |
| AI-03 | AI can identify customer intent: pricing, availability, delivery, payment, order status, complaint, refund, and general inquiry. | P0 |
| AI-04 | AI can recognize products from customer-uploaded images. | P1 |
| AI-05 | AI displays confidence score and cited knowledge source where applicable. | P0 |
| AI-06 | AI cannot send messages automatically in default “Draft only” mode. | P0 |
| AI-07 | Merchants can enable auto-reply only for selected intents and conditions. | P1 |
| AI-08 | AI must escalate when confidence is low or the request is high-risk. | P0 |
| AI-09 | Merchants can define business hours, escalation keywords, and escalation rules. | P0 |
| AI-10 | Every AI suggestion, edit, approval, rejection, and sent message is logged. | P0 |
| AI-11 | Merchants can set brand tone: formal, friendly, promotional, or concise. | P1 |
| AI-12 | AI must refuse to invent prices, stock availability, policies, or delivery times when data is missing. | P0 |

### 8.5 Knowledge Base

| ID | Requirement | Priority |
|---|---|---|
| KB-01 | Merchants can create and edit FAQ entries. | P0 |
| KB-02 | Merchants can upload policy documents, delivery rules, and business information. | P0 |
| KB-03 | Merchants can import products via CSV and Google Sheets. | P0 |
| KB-04 | Merchants can manually add products, variants, prices, stock, images, and descriptions. | P0 |
| KB-05 | System supports retrieval-augmented answers from approved knowledge sources. | P0 |
| KB-06 | Merchants can test the assistant before going live. | P0 |
| KB-07 | System identifies unanswered or low-confidence questions. | P0 |
| KB-08 | Knowledge-base changes are versioned and reversible. | P1 |
| KB-09 | Merchants can approve or reject AI-suggested FAQ additions. | P1 |

### 8.6 CRM and Leads

| ID | Requirement | Priority |
|---|---|---|
| CRM-01 | ReplyRaja creates a customer profile from conversations. | P0 |
| CRM-02 | Profile includes name, phone, channel, tags, conversation history, orders, and notes. | P0 |
| CRM-03 | System tracks lead stages: New, Interested, Price Sent, Payment Pending, Order Placed, Delivered, Returned, Lost. | P0 |
| CRM-04 | Agents can manually update lead stage and add tags. | P0 |
| CRM-05 | System suggests follow-ups for abandoned inquiries and pending payments. | P1 |
| CRM-06 | Follow-up messages are drafts by default. | P1 |
| CRM-07 | Merchants can create customer segments using tags, stage, channel, and order value. | P2 |

### 8.7 Orders and Commerce

| ID | Requirement | Priority |
|---|---|---|
| ORD-01 | AI can collect order details through conversation. | P0 |
| ORD-02 | Merchants can create, edit, confirm, cancel, and mark orders as delivered. | P0 |
| ORD-03 | Order fields include customer name, phone, address, products, quantity, variants, delivery area, delivery charge, payment method, and notes. | P0 |
| ORD-04 | System supports Cash on Delivery, bKash, Nagad, and manual bank transfer. | P0 |
| ORD-05 | System prevents duplicate orders using phone number and recent-order checks. | P1 |
| ORD-06 | System generates an order confirmation draft for the customer. | P0 |
| ORD-07 | Merchants can manually update courier status in v1. | P1 |
| ORD-08 | System can integrate courier APIs or receive courier webhooks in v1.1. | P1 |
| ORD-09 | Merchants can export orders to CSV. | P1 |

### 8.8 Analytics

| ID | Requirement | Priority |
|---|---|---|
| AN-01 | Dashboard shows conversation volume by channel and date. | P0 |
| AN-02 | Dashboard shows first-response time and resolution time. | P0 |
| AN-03 | Dashboard shows AI-drafted, AI-sent, and human-sent message volumes. | P0 |
| AN-04 | Dashboard shows orders created and revenue influenced by conversations. | P0 |
| AN-05 | Dashboard shows top customer questions and product interests. | P0 |
| AN-06 | Dashboard shows escalation reasons and low-confidence topics. | P0 |
| AN-07 | Dashboard shows agent performance and workload. | P1 |
| AN-08 | Merchants can export reports as CSV. | P1 |
| AN-09 | System provides weekly recommendations to improve knowledge-base coverage. | P2 |

### 8.9 Chrome Extension

| ID | Requirement | Priority |
|---|---|---|
| EXT-01 | Extension works within Meta Business Suite inbox. | P1 |
| EXT-02 | Extension displays customer summary, previous inquiries, and order context. | P1 |
| EXT-03 | Extension generates reply drafts based on conversation context. | P1 |
| EXT-04 | Extension shows follow-up reminders and escalation alerts. | P1 |
| EXT-05 | Extension never sends messages automatically without explicit merchant action. | P1 |
| EXT-06 | Extension requires an active ReplyRaja account and secure authentication. | P1 |

---

## 9. AI Behavior Rules

ReplyRaja must follow strict guardrails:

- Do not invent product availability, prices, discounts, delivery times, or policies.
- Use only merchant-approved knowledge-base content for factual answers.
- Escalate refund, return, legal, abusive, medical, financial, or high-value-order requests.
- Escalate when customer intent is unclear or confidence is below the merchant-configured threshold.
- Do not send promotional messages without merchant approval.
- Respect WhatsApp template and messaging rules.
- Maintain an audit trail for every AI-generated response and human decision.
- Allow merchants to disable AI for specific conversations, products, or channels.

---

## 10. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Inbox should load in under 2 seconds for typical workspaces. |
| AI latency | AI draft generation should complete within 5 seconds for 90% of requests. |
| Availability | Target 99.5% monthly uptime for core inbox and messaging features. |
| Scalability | System should support 10,000 conversations per workspace per month at launch. |
| Security | Encrypt data in transit and at rest; enforce role-based access. |
| Reliability | Queue inbound/outbound messages and retry failed webhook deliveries. |
| Accessibility | Support keyboard navigation, readable contrast, and responsive layouts. |
| Localization | Full Bengali and English UI support. |
| Auditability | Retain logs of AI actions, human approvals, data changes, and channel events. |
| Backup | Daily automated database backups with tested restore process. |

---

## 11. Integrations

### 11.1 v1 Integrations

- Facebook Messenger via Meta Graph API
- WhatsApp Business Cloud API
- CSV product import
- Google Sheets product import
- Email transactional service
- Payment-status manual entry

### 11.2 v1.1 Integrations

- Instagram Messaging API
- Website chat widget
- Courier APIs or webhook integrations
- WooCommerce and Shopify product sync
- Zapier/Make or public REST API

---

## 12. Data, Privacy, and Compliance

ReplyRaja will process merchant and end-customer conversation data. The platform must clearly explain what data is collected, why it is processed, how long it is retained, and how users can request deletion.

### Requirements

- Encrypt all data in transit and at rest.
- Store customer data only for service delivery, support, security, and legally required purposes.
- Do not sell customer data or use it for unrelated advertising.
- Allow merchants to delete individual conversations, disconnect channels, or delete their entire account.
- Provide data-export functionality for merchants.
- Maintain role-based access so agents see only authorized workspace data.
- Log access to sensitive customer data.
- Provide privacy policy, terms of service, and data-deletion instructions in Bengali and English.
- Obtain necessary permissions before accessing or processing merchant channel data.
- Comply with Meta platform, WhatsApp Business, and applicable data-protection requirements.

---

## 13. Monetization

### 13.1 Pricing Model

ReplyRaja should use transparent subscription tiers with optional usage-based overage.

| Plan | Target user | Core inclusions |
|---|---|---|
| Starter | New/small sellers | One Facebook Page, AI drafts, FAQ assistant, limited monthly AI conversations, one user |
| Growth | Active sellers | Facebook, WhatsApp, product catalog, order capture, lead tracking, analytics, team seats |
| Pro | High-volume sellers | Multi-channel coverage, advanced automation, courier updates, priority support, API access |
| Agency | Agencies/multi-brand sellers | Multiple client workspaces, consolidated reporting, roles, white-label options |

### 13.2 Additional Revenue

- Paid onboarding and catalog-setup service
- Annual subscription discount
- Extra WhatsApp numbers or connected pages
- Custom integration service
- Premium template packs
- Priority support plan

### 13.3 Billing Requirements

- 14-day free trial or limited free plan
- Monthly and annual billing
- Local payment options where feasible
- Clear usage metering for AI conversations
- Overage alerts before charges
- Invoice history and plan-management screen

---

## 14. MVP Release Plan

### Phase 1: Core MVP — Weeks 1–6

- Authentication, workspace, and roles
- Facebook Messenger connection
- Unified inbox
- AI reply drafts with human approval
- FAQ and product knowledge base
- Product catalog import
- Lead capture
- Basic order creation
- Basic analytics
- Bengali-first marketing site
- Privacy, terms, and data-deletion pages

### Phase 2: Commerce Expansion — Weeks 7–10

- WhatsApp Business Cloud API
- Product photo recognition
- Order confirmation and courier-status fields
- Follow-up reminders
- Escalation rules
- Chrome extension beta
- Improved analytics

### Phase 3: Scale Features — Weeks 11–14

- Instagram messaging
- Website chat widget
- Automated replies for approved intents
- Agency workspaces
- Courier API integrations
- Public API
- Advanced reporting

---

## 15. Key Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| AI gives incorrect product or policy answers | Customer distrust, lost sales | Require source-backed answers, confidence thresholds, human approval, and escalation rules |
| Merchants fear losing control | Low adoption | Default to draft-only mode and make human approval visible |
| Meta/WhatsApp policy or API changes | Channel disruption | Use official APIs, monitor policy updates, and design modular channel adapters |
| Bengali/Banglish understanding quality | Poor replies | Build Bengali evaluation datasets, merchant feedback loop, and continuous prompt/model testing |
| WhatsApp message costs | Margin pressure | Meter usage, offer plan limits, alert merchants before overage, and optimize message volume |
| Data-privacy concerns | Legal and trust risk | Strong access controls, deletion workflows, transparent policies, and compliance review |
| Low differentiation from generic chatbots | Weak conversion | Focus on Bengali-first experience, order capture, courier workflow, and measurable ROI |

---

## 16. Open Questions

1. Should the initial launch prioritize Facebook Messenger only, or Facebook plus WhatsApp from day one?
2. Will the initial business model be self-serve, concierge onboarding, or hybrid?
3. Which AI provider will be used at launch, and will merchants be able to choose their own provider?
4. Should product photo recognition be included in the first paid tier or reserved for Pro?
5. Which courier providers should be integrated first?
6. Will ReplyRaja support agencies at launch or after proving direct-merchant traction?
7. What is the preferred local payment provider for subscriptions?
8. Should the product use a `.com`, `.com.bd`, or `.ai` primary domain?

---

## 17. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Product owner | Zunaid Ishan | Pending |  |
| Engineering lead | TBD | Pending |  |
| Design lead | TBD | Pending |  |
| Legal/compliance reviewer | TBD | Pending |  |
