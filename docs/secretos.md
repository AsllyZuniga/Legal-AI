# Secretos y configuración de IA

Reglas y pasos para que el sistema funcione con las claves de IA **sin filtrar nada a GitHub**.

## Regla de oro

- Las claves reales viven **solo** en `.env` (ignorado por git).
- GitHub recibe **solo** `.env.example` y `.env.production.example` con marcadores
  (`CAMBIAR_POR_SEGURO`, `tu-clave-de-gemini-aqui`). Nunca una clave real.
- La app lee las claves en tiempo de ejecución desde `.env`; no las necesita en el código.

## Dónde va cada clave

| Archivo | Uso |
| --- | --- |
| `.env` (raíz) | Todo el stack (Postgres, Redis, MinIO, JWT, IA, CIFRADO). |
| `apps/ai/.env` | Solo el servicio de IA (FastAPI). |
| `apps/api/.env` | Solo la API (NestJS). |
| `packages/database/.env` | Prisma (migraciones y seed). |

Todos están en `.gitignore` (patrón `.env` y `.env.*`). Solo las plantillas `*.example` se versionan.

## Proveedor LLM (Gemini por defecto)

En `.env`:

```dotenv
OPENAI_API_KEY=<tu-clave-de-gemini>
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.5-flash
```

Alternativa OpenRouter (una sola clave, varios modelos):

```dotenv
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=google/gemini-2.5-flash
```

Embeddings: **locales** con `EMBEDDING_PROVIDER=local` y `LOCAL_EMBEDDING_MODEL=BAAI/bge-m3`
(gratis, sin clave). No dependen de ninguna API.

## Cómo generar cada secreto

| Secreto | Comando / fuente |
| --- | --- |
| `DB_PASSWORD`, `REDIS_PASSWORD`, `MINIO_ROOT_PASSWORD`, `AI_SERVICE_SECRET`, `JWT_SECRET`, `JWT_REFRESH_SECRET` | `openssl rand -hex 48` |
| `TOKEN_ENCRYPTION_KEY` (AES-256-GCM, 32 bytes) | `openssl rand -hex 32` |
| `OPENAI_API_KEY` (Gemini) | https://aistudio.google.com/apikey |
| `OPENAI_API_KEY` (OpenRouter) | https://openrouter.ai/keys |

## Lo que NUNCA va a GitHub

- No `git add .env*` a ciegas: haz staging explícito por archivo.
- No claves en código, plantillas, docker-compose ni logs.
- No `CAMBIAR_POR_SEGURO` con un valor real.

Verificación antes de cada push:

```powershell
git diff --cached | Select-String -Pattern "AIzaSy|sk-or-|gsk_|oc_sk_|CAMBIAR_POR_SEGURO"
```

Si aparece una línea con una clave real (patrones `AIzaSy`, `sk-`, `gsk_`, `oc_sk_`), aborta el push.

## Confirmar que nada está filtrado

```powershell
# 1) El .env real está ignorado (debe devolver ".env")
git check-ignore .env

# 2) Solo las plantillas están versionadas (debe listar .env.example y .env.production.example)
git ls-files | Select-String -Pattern "\.env"
```

## Si una clave ya se filtró

1. **Revócala y regenérala** en el proveedor (Google AI Studio / OpenRouter / OpenCode / Groq).
2. Rota el valor en tu `.env`.
3. Si quedó en un commit, **no basta con borrarlo del archivo**: hay que purgar el historial
   (`git filter-repo` o BFG) y forzar el push. Las claves revocadas dejan de funcionar, pero
   el historial sigue exponiendo la referencia.

## Resumen operativo

- Clave de IA → `.env` local (gitignored) → la app la lee y funciona.
- GitHub → solo código + plantillas con placeholders → cero secretos.
