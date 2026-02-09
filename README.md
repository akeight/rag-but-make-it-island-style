# Epstein Emails RAG Chatbot (Next.js + Bun + MongoDB Atlas)

A source-grounded RAG (Retrieval-Augmented Generation) chatbot for exploring the **Epstein emails dataset** via a clean web UI. The app ingests the dataset into **MongoDB Atlas**, retrieves relevant chunks using **Atlas Vector Search**, and generates answers with an LLM while returning **citations** you can click to verify in a simple document/thread viewer.

> **Note:** The dataset originates from OCR’d public documents and may contain sensitive/graphic content. This project is built for exploration and verification — always check sources.

---
## Video Walkthrough

Here's a walkthrough of implemented user stories:

<img src="./public/home.png" alt="Walkthrough demo" />


---

## Features (MVP → Full RAG)
- Landing page (`/`) with hero + CTA
- Chat page (`/chat`)
- Dataset ingestion script (threads + messages) into MongoDB
- (Planned) Chunking + embeddings backfill
- (Planned) Retrieval endpoint using Atlas Vector Search
- (Planned) Citations panel + thread viewer (`/docs/[threadKey]`)
- Rate limiting + cost controls on chat endpoints

---

## Tech stack
- **Next.js** (App Router)
- **Bun** (package manager + runtime)
- **Tailwind CSS**
- **shadcn/ui** components
- **React Bits** for UI/background accents
- **MongoDB Atlas** (document store + Vector Search)
- **OpenAI API** (server-side key in env secrets)

---

## Architecture (high level)
1. **Ingest** dataset → store `threads` + `messages` in MongoDB
2. **Chunk** message bodies → store `chunks`
3. **Embed** chunks → store `embedding[]` on each chunk
4. **Retrieve**: embed query → `$vectorSearch` over `chunks.embedding`
5. **Generate**: LLM answers using retrieved context + returns citations

---

## Repo structure
```txt
.
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx                  # landing page (/)
│  ├─ chat/page.tsx             # chat UI (/chat)
│  ├─ docs/[threadKey]/page.tsx # source viewer (planned)
│  └─ api/
│     ├─ health/route.ts
│     ├─ retrieve/route.ts      # planned
│     └─ chat/route.ts          # planned
├─ components/
│  └─ ui/                       # shadcn components live here
├─ lib/
│  ├─ mongodb.ts
│  ├─ rateLimit.ts
│  ├─ embeddings.ts             # planned
│  └─ rag.ts                    # planned
├─ scripts/
│  └─ ingest.ts                 # planned
├─ public/
├─ .env.local
├─ components.json              # shadcn config
├─ tailwind.config.ts
├─ tsconfig.json
├─ package.json
└─ bun.lock
```
---

## Getting started
### Prereqs
- Bun installed
- A MongoDB Atlas cluster + connection string
- OpenAI API key

### Install
```bash
git clone https://github.com/akeight/rag-but-make-it-island-style.git
bun install
```
### Environment variables
Create .env.local in the repo root:
```bash
MONGODB_URI="mongodb+srv://..."
MONGODB_DB="epstein_rag"

# Server-side only:
OPENAI_API_KEY="..."
RATE_LIMIT_SALT="some-random-string"
ALLOWED_ORIGINS="http://localhost:3000,https://your-vercel-domain.com"
```
### Run dev server
```bash
bun run dev
```

---

## References
Dataset (Hugging Face):
https://huggingface.co/datasets/notesbymuneeb/epstein-emails

Hugging Face datasets-server /rows API:
https://huggingface.co/docs/dataset-viewer/en/rows

MongoDB Atlas Vector Search:
https://www.mongodb.com/docs/atlas/atlas-vector-search/

OpenAI API:
https://platform.openai.com/docs/


