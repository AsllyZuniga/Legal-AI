# Legal-AI

AI-powered legal intelligence platform for Colombian law. Monorepo managed with Turborepo.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + TailwindCSS |
| API | NestJS (TypeScript) |
| AI Service | FastAPI (Python) |
| Database | PostgreSQL + pgvector |
| Cache | Redis |
| Storage | MinIO (S3-compatible) |
| ORM | Prisma |

## Apps

- **apps/web** - React frontend (cases, chat, templates, jurisprudence)
- **apps/api** - NestJS REST API
- **apps/ai** - FastAPI service (LLM, embeddings, reranking, hallucination guard)

## Packages

- **packages/database** - Prisma schema, seeds, migrations
- **packages/shared-types** - Shared TypeScript types
- **packages/config** - Shared configuration

## Getting started

```bash
cp .env.example .env
npm install
npm run docker:up
npm run dev
```

## Scripts

- `npm run dev` - Start all apps in dev mode
- `npm run build` - Build all apps
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:seed` - Seed database
- `npm run docker:up` / `docker:down` - Manage Docker services
