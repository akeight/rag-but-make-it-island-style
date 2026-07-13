# Epstein Emails RAG Chatbot (Next.js + Bun + MongoDB Atlas)

A source-grounded RAG (Retrieval-Augmented Generation) chatbot for exploring the **Epstein emails dataset** via a clean web UI. The app ingests the dataset into **MongoDB Atlas**, retrieves relevant chunks using **Atlas Vector Search**, and generates answers with an LLM while returning **citations** you can click to verify in a simple document/thread viewer.

> **Note:** The dataset originates from OCR’d public documents and may contain sensitive/graphic content. This project is built for exploration and verification — always check sources.

---
## Video Walkthrough

Here's a walkthrough of implemented user stories:

<img src="./public/walkthrough.gif" alt="Walkthrough demo" />


---

## Features (MVP → Full RAG)
- Landing page (`/`) with hero + CTA
- Chat page (`/chat`) with source-grounded answers
- Dataset ingestion script (threads + messages) into MongoDB
- Chunking + embeddings backfill
- Retrieval endpoint using Atlas Vector Search
- Citations panel on chat answers + real thread browser/viewer (`/docs`, `/docs/[threadKey]`)
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
│  ├─ page.tsx                       # landing page (/)
│  ├─ chat/page.tsx                  # chat UI (/chat)
│  ├─ docs/page.tsx                  # thread browser (/docs)
│  ├─ docs/[threadKey]/page.tsx      # thread viewer (/docs/[threadKey])
│  ├─ about/page.tsx                 # about (/about)
│  └─ api/
│     ├─ chat/route.ts               # embed query -> vector search -> LLM answer + citations
│     ├─ retrieve/route.ts           # embed query -> vector search (raw hits)
│     ├─ threads/route.ts            # list/search/paginate threads
│     └─ threads/[threadKey]/route.ts# thread + its messages
├─ components/
│  ├─ citations.tsx                  # CitationCard
│  ├─ sources-panel.tsx             # sources sheet for chat answers
│  └─ ui/                            # shadcn components live here
├─ lib/
│  ├─ mongodb.ts                     # Mongo client + VECTOR_INDEX const
│  ├─ rate-limit.ts                  # per-IP fixed-window limiter
│  └─ types.ts                       # shared types
├─ scripts/
│  ├─ ingest.ts                      # HF dataset -> threads + messages
│  ├─ chunk_backfill.ts              # messages -> chunks
│  ├─ embed_backfill.ts              # chunks -> embeddings
│  ├─ create_vector_index.ts         # create Atlas Vector Search index
│  └─ test_vector.ts                 # sanity-check retrieval
├─ public/
├─ .env.local
├─ components.json                   # shadcn config
├─ tsconfig.json
├─ package.json
└─ bun.lock
```
---

## Data pipeline (run once, in order)
```bash
bun scripts/ingest.ts            # 1. threads + messages
bun scripts/chunk_backfill.ts    # 2. chunks from message bodies
bun scripts/embed_backfill.ts    # 3. embeddings on chunks
bun scripts/create_vector_index.ts  # 4. Atlas Vector Search index "vector_index"
bun scripts/test_vector.ts "palm beach house"  # 5. sanity check
```
> The vector index name is defined once in `lib/mongodb.ts` (`VECTOR_INDEX`) and must match the index created in step 4. If your Atlas tier does not allow programmatic index creation, create it in the Atlas UI: collection `chunks`, name `vector_index`, a `vector` field on `embedding` (1536 dims, cosine), plus `filter` fields `threadKey` and `messageKey`.

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
MONGODB_DB="your-db-name"

# Server-side only:
OPENAI_API_KEY="..."          # must belong to an account with active billing/quota
CHAT_MODEL="gpt-5.2"          # must be a chat/Responses model available to your account
EMBED_MODEL="text-embedding-3-small"  # 1536 dims; must match the vector index
RATE_LIMIT_SALT="some-random-string"
ALLOWED_ORIGINS="http://localhost:3000"

# These are set to sucessfully injest dataset from huggingface to mongodb database
HF_DATASET="notesbymuneeb/epstein-emails"
HF_CONFIG="default"
HF_SPLIT="train"  
HF_PAGE_SIZE="25"
HF_START_OFFSET="4800"
HF_DELAY_MS=2000
HF_MAX_ROWS="0" 
STORE_RAW_MESSAGE="false" 

CHUNK_MAX_CHARS=2000
CHUNK_OVERLAP_CHARS=200
CHUNK_BATCH_MESSAGES=200

EMBED_MODEL=text-embedding-3-small
EMBED_BATCH_SIZE=64
EMBED_DELAY_MS=250
EMBED_MAX_CHUNKS=0          #(0 = no cap; useful for testing)
EMBED_QUERY_FILTER='{}'     #(extra mongo filter JSON for chunks, e.g. {"threadKey":"..."} )
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


