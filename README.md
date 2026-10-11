# ReplyRaja

**AI that turns customer messages into orders.**

ReplyRaja helps online businesses in Bangladesh answer customers faster, capture more orders, and keep control of every conversation. It sits on top of the channels you already use — Messenger, WhatsApp, Instagram, and your website — and turns repetitive questions into drafts you can approve, edit, or send.

---

## Why ReplyRaja

Most sellers lose sales because they cannot reply in time. The same questions keep coming: price, size, delivery charge, COD, stock. Generic chatbots either sound wrong in Bangla or send answers no one checked. ReplyRaja is built for that reality:

- **Bangla and Banglish first** — replies that match how your customers actually write  
- **You stay in control** — AI drafts; you approve (or enable automation only when you trust it)  
- **Orders from chat** — turn a conversation into a confirmed order without switching tools  
- **One inbox** — Facebook, WhatsApp, Instagram, and website chat in a single place  

---

## What it does

| Capability | What you get |
|---|---|
| Unified inbox | All channels in one thread list with assignment and status |
| AI reply drafts | Context-aware suggestions grounded in your products and FAQs |
| Human approval | Review, edit, and send — or escalate when it matters |
| Product & FAQ knowledge | Import catalog and policies so answers stay accurate |
| Lead & order capture | Track interest and create orders from the conversation |
| Basic analytics | Response time, AI usage, escalations, and orders created |

---

## Who it’s for

- Facebook/Instagram page sellers  
- WhatsApp-based shops  
- Small teams that need faster replies without losing the human touch  
- Agencies managing multiple merchant accounts (roadmap)  

---

## Tech overview

| Layer | Choice |
|---|---|
| App | Next.js (TypeScript) |
| API | NestJS or FastAPI |
| Database | PostgreSQL + pgvector |
| Jobs / cache | Redis |
| Storage | S3-compatible object storage |
| Channels | Official Meta / WhatsApp Cloud APIs |
| AI | Provider-agnostic (LLM + embeddings + vision) |

Designed as a modular monolith for the first release: one API service, background workers, and a clear path to split services later if needed.

---

## Project status

Early stage. Core docs and architecture are in place; implementation is starting from the MVP scope (auth, Messenger, inbox, AI drafts, knowledge base, basic orders).

See the `docs/` folder for product and technical specifications.

---

## Repository layout

```text
ReplyRaja/
├── docs/           # Product & technical documents
├── apps/           # (planned) web, api, workers
├── packages/       # (planned) shared types & UI
└── README.md
```

---

## Getting started (when code lands)

```bash
# Clone
git clone https://github.com/zunaidhasan/ReplyRaja.git
cd ReplyRaja

# Install (example — exact commands will match the monorepo setup)
pnpm install

# Environment
cp .env.example .env.local
# Fill in database, Redis, Meta, and AI keys

# Run
pnpm dev
```

You will need:

- Node.js 20+ (or the version pinned in the repo)  
- PostgreSQL 15+  
- Redis  
- Meta developer app (for Messenger / WhatsApp)  
- An LLM API key for draft generation  

Detailed setup steps will live in the docs once the first runnable scaffold is pushed.

---

## Contributing

This project is under active design and early build. If you want to collaborate on engineering, design, or design-partner onboarding, open an issue or reach out to the maintainer.

Please do not submit PRs against unfinished scaffolding until contribution guidelines are published.

---

## License

License to be decided. Until then, all rights reserved by the project owner.

---

## Contact

**Zunaid Ishan**  
Maintainer · ReplyRaja  

- GitHub: [zunaidhasan](https://github.com/zunaidhasan)  
- Email: connect.zunaid@gmail.com  

---

*ReplyRaja — কাস্টমারের মেসেজকে অর্ডারে পরিণত করুন।*

---
