# Despliegue y verificación

Este documento explica cómo **ver el sistema funcionando** de tres formas: en tu máquina, en GitHub (CI) y en la nube.

## 1. Verlo funcionando en tu máquina (una sola orden)

Levanta **las 6 piezas** (Postgres+pgvector, Redis, MinIO, API, IA, Web) con:

```powershell
docker compose -f docker-compose.full.yml up --build
```

Cuando termine (la primera vez tarda: `npm ci` + dependencias de Python + tesseract), abre:

| Servicio | URL |
| --- | --- |
| Web (interfaz) | http://localhost:8080 |
| API (Swagger) | http://localhost:3001/docs |
| IA (health) | http://localhost:8000/internal/health |
| MinIO (consola) | http://localhost:9001 |
| Postgres | localhost:5433 |

La web de `localhost:8080` habla con la API por el proxy interno de nginx (`/api` → servicio `api`), así que no hay que configurar URLs del backend.

Variables: el compose toma valores del archivo `.env` de la raíz (copia `.env.example` a `.env` y ajusta). Si no existe, usa los defaults locales de desarrollo. **Antes de exponerlo a internet, cambia todas las contraseñas y los secretos JWT.**

Para bajar todo: `docker compose -f docker-compose.full.yml down`. Para borrar también datos: añade `-v`.

> Nota: el compose de desarrollo `docker-compose.yml` sigue levantando **solo infraestructura** (Postgres, Redis, MinIO) para trabajar con las apps en local sin contenedores. El stack completo es `docker-compose.full.yml`.

## 2. Verlo compilando en GitHub (CI)

En cada push o pull request a `main`, GitHub Actions ejecuta `.github/workflows/ci.yml`:

- **Build (turbo):** `npm ci` + `prisma generate` + `npm run build` (shared-types, api y web).
- **Syntax check (Python):** compila `apps/ai/app` y `apps/mcp`.

Estado en: https://github.com/AsllyZuniga/Legal-AI/actions (o el badge del README).

Pendiente de configurar (hoy **no** está y por eso no se ejecuta en CI): linter. Los scripts `npm run lint` existen pero **no hay `eslint` instalado ni configuración** en ningún workspace, así que fallarían. Es una tarea aparte.

## 3. Ponerlo online con URL pública

GitHub **no** ejecuta aplicaciones web; solo compila (CI) y guarda código. Para una URL pública que abra en cualquier navegador hay dos caminos reales:

### Opción recomendada: un servidor propio (VPS)

Es el que respeta la arquitectura tal cual, sin adaptaciones:

1. Un VPS (DigitalOcean, Hetzner, AWS Lightsail…) con Docker instalado.
2. Clonar el repo, crear el `.env` de producción con secretos fuertes.
3. `docker compose -f docker-compose.full.yml up -d --build`.
4. Abrir el puerto 8080 y poner delante un reverse proxy con TLS (Caddy o nginx + Let's Encrypt).
5. En `.env`, poner `FRONTEND_URL` con el dominio real (lo usa CORS; también el redirect de Google OAuth).

Google OAuth, además, exige registrar el redirect exacto `https://tu-dominio/integrations/google/callback` en Google Cloud (ver `docs/ingeniero.md`).

### Alternativa: plataformas PaaS (Render / Railway / Fly.io)

Son cómodas, pero este stack tiene tres piezas que **no encajan sin trabajo extra**:

- **Postgres con `pgvector`:** en Render solo está en planes pagos.
- **MinIO** (almacenamiento S3 local): no existe como servicio gestionado; hay que desplegarlo aparte con disco persistente.
- **nginx del frontend:** hoy apunta al host interno `api`; en un PaaS el hostname interno es distinto y hay que parametrizarlo.

Por eso no hay un `render.yaml` de un clic: quedaría roto. Si eliges esta vía, el adaptado sería un trabajo aparte (parametrizar el proxy y sustituir MinIO por S3 real).

## 4. Antes de exponer en producción

- Cambiar contraseñas por defecto (`CAMBIAR_POR_SEGURO`, `CAMBIAR_POR_SEGURO`, `CAMBIAR_POR_SEGURO`) y los `JWT_SECRET` / `JWT_REFRESH_SECRET`.
- Revisar `docs/ingeniero.md` (fases 1 y 2): hay correcciones de confidencialidad pendientes (URLs públicas de documentos, borrado real en MinIO/Drive, cifrado de tokens).
- El seed real no está en `npm run db:seed` (es un `echo`): revisar `packages/database/seed-mock.sql`.
