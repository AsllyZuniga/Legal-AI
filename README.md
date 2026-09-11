<div align="center">

# Legal AI

### AI-Powered Legal Intelligence Platform for Colombian Law

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## Overview

**Legal AI** is a full-stack platform that leverages artificial intelligence to assist Colombian legal professionals with case management, document generation, semantic jurisprudence search, and real-time legal chat. Built as a Turborepo monorepo with three decoupled services.

## Key Features

- **Legal Chat** — Conversational AI assistant with hallucination guardrails, powered by OpenAI / Anthropic
- **Case Management** — Full lifecycle: facts, evidence, persons, hearings, tasks, timelines, alerts
- **Document Generation** — 493+ Colombian legal templates (contracts, lawsuits, powers of attorney, tutelas, etc.)
- **Semantic Search** — Vector-based jurisprudence retrieval using pgvector + OpenAI embeddings + Cohere reranking
- **Legal Analysis** — AI-powered case analysis with hallucination verification
- **Jurisprudence Library** — Ingested rulings from Corte Constitucional, Consejo de Estado, Corte Suprema, and SUIN
- **Google Drive Integration** — OAuth-based document sync
- **Legal News Feed** — Curated legal news aggregation

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    apps/web (React)                      │
│              Vite + TailwindCSS + Zustand                │
└──────────────────────┬──────────────────────────────────┘
                       │ REST
┌──────────────────────▼──────────────────────────────────┐
│                   apps/api (NestJS)                      │
│   Auth (JWT) │ Cases │ Documents │ Chat │ Generation     │
│   Analysis   │ Templates │ Jurisprudence │ Integrations  │
└──────────┬───────────────────────────────────┬──────────┘
           │ Internal API                      │
┌──────────▼──────────────────────────────────┐│
│               apps/ai (FastAPI)             ││
│  Embeddings │ Search │ Analyze │ Generate   ││
│  Verify (Hallucination Guard) │ Chat        ││
│  LLM: OpenAI/Anthropic │ Rerank: Cohere    ││
└──────────┬──────────────────────────────────┘│
           │                                    │
┌──────────▼──────────┐ ┌──────────┐ ┌────────▼───────┐
│  PostgreSQL+pgvector │ │  Redis   │ │  MinIO (S3)    │
│  (Vectors + Data)    │ │ (Cache)  │ │  (Documents)   │
└─────────────────────┘ └──────────┘ └────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TailwindCSS + Zustand + React Router |
| **API** | NestJS + Passport + JWT + Prisma |
| **AI Service** | FastAPI + OpenAI + Anthropic + Cohere Rerank |
| **Database** | PostgreSQL 16 + pgvector |
| **Cache** | Redis 7 |
| **Storage** | MinIO (S3-compatible) |
| **ORM** | Prisma |
| **Monorepo** | Turborepo |
| **Infrastructure** | Docker Compose |

## Repository Structure

```
legal-ai/
├── apps/
│   ├── web/           # React SPA (cases, chat, templates, news)
│   ├── api/           # NestJS REST API (15 modules)
│   └── ai/            # FastAPI AI service (embeddings, search, generation, verification)
├── packages/
│   ├── database/      # Prisma schema, seeds, SQL migrations
│   ├── shared-types/  # Shared TypeScript interfaces
│   └── config/        # Shared configuration
├── infrastructure/    # Docker and deployment scripts
├── tests/             # E2E tests and fixtures
├── docker-compose.yml # PostgreSQL + Redis + MinIO
└── turbo.json         # Turborepo pipeline config
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Python 3.12+
- Docker & Docker Compose

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/AsllyZuniga/Legal-AI.git
cd legal-ai

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys (OpenAI, Cohere, etc.)

# 3. Install dependencies
npm install

# 4. Start infrastructure (PostgreSQL, Redis, MinIO)
npm run docker:up

# 5. Set up database
npm run db:migrate
npm run db:seed

# 6. Start all services
npm run dev
```

### Services

| Service | URL | Description |
|---------|-----|-------------|
| Web App | http://localhost:5173 | React frontend |
| API | http://localhost:3001 | NestJS REST API |
| AI Service | http://localhost:8000 | FastAPI AI engine |
| MinIO Console | http://localhost:9001 | Document storage |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps for production |
| `npm run test` | Run test suites |
| `npm run lint` | Lint all packages |
| `npm run db:migrate` | Run Prisma database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:reset` | Reset database (destructive) |
| `npm run docker:up` | Start Docker services (detached) |
| `npm run docker:down` | Stop Docker services |
| `npm run docker:logs` | Tail Docker service logs |

## Data Ingestion

The platform includes scrapers for Colombian legal sources:

```bash
python fetch-suin.py                    # SUIN / Juriscol
python fetch-fulltexts.py               # Full-text rulings
python ingest-corte-constitucional.py   # Constitutional Court
```

Scrapers cover: **Corte Constitucional**, **Consejo de Estado**, **Corte Suprema de Justicia**, and **CNDJ**.

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `OPENAI_API_KEY` | OpenAI API key for LLM & embeddings |
| `COHERE_API_KEY` | Cohere API key for reranking |
| `JWT_SECRET` | JWT signing secret |
| `MINIO_*` | MinIO storage configuration |
| `REDIS_URL` | Redis connection string |

## License

This project is licensed under the MIT License.
