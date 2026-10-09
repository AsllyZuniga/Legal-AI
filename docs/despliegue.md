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

Variables: el compose **exige** un archivo `.env` en la raíz (copia `.env.example` a `.env` y rellena los secretos). Ya **no hay credenciales por defecto** en el repositorio: los servicios fallan con un mensaje claro si falta la variable. Los puertos de infraestructura se publican solo en `127.0.0.1` (no accesibles desde la red).

Para bajar todo: `docker compose -f docker-compose.full.yml down`. Para borrar también datos: añade `-v`.

> Nota: el compose de desarrollo `docker-compose.yml` sigue levantando **solo infraestructura** (Postgres, Redis, MinIO) para trabajar con las apps en local sin contenedores. El stack completo es `docker-compose.full.yml`.

## 2. Verlo compilando en GitHub (CI)

En cada push o pull request a `main`, GitHub Actions ejecuta `.github/workflows/ci.yml`:

- **Build (turbo):** `npm ci` + `prisma generate` + `npm run build` (shared-types, api y web).
- **Syntax check (Python):** compila `apps/ai/app` y `apps/mcp`.

Estado en: https://github.com/AsllyZuniga/Legal-AI/actions (o el badge del README).

Pendiente de configurar (hoy **no** está y por eso no se ejecuta en CI): linter. Los scripts `npm run lint` existen pero **no hay `eslint` instalado ni configuración** en ningún workspace, así que fallarían. Es una tarea aparte.

## 3. Ponerlo online con UN solo link (VPS + Caddy)

GitHub **no** ejecuta aplicaciones web; solo compila (CI) y guarda código. Para tener una única URL pública
(por ejemplo `https://legal-ai.tudominio.com`) que abra todo el programa, el camino que respeta esta
arquitectura tal cual es un **VPS con Docker + Caddy** (reverse proxy con TLS automático).

El `docker-compose.full.yml` ya trae el servicio `caddy` bajo el perfil `prod`. Pasos:

1. **VPS** (DigitalOcean, Hetzner, AWS Lightsail…) con Docker y Docker Compose instalados. Abre los puertos **80** y **443**.
2. **DNS:** crea un registro `A` de tu dominio (p. ej. `legal-ai.tudominio.com`) apuntando a la IP del VPS. Espera la propagación.
3. **Clonar** el repo en el servidor y entrar a la carpeta.
4. **Crear el `.env` de producción:**
   ```bash
   cp .env.production.example .env
   # edita .env: DOMAIN, ACME_EMAIL, FRONTEND_URL
   # y genera cada secreto con:  openssl rand -hex 48
   ```
5. **Levantar todo (una sola orden):**
   ```bash
   docker compose -f docker-compose.full.yml --profile prod up -d --build
   ```
6. Abre **`https://tu-dominio`**. Caddy obtiene y renueva el certificado solo. Ese es el único link.

Qué queda expuesto: solo **80/443** (Caddy). Postgres, Redis, MinIO, API, IA y la web quedan atados a
`127.0.0.1` dentro del servidor. El nginx del contenedor `web` enruta `/api` a la API, así que el frontend y
el backend comparten el mismo dominio sin configurar URLs.

Google OAuth exige registrar el redirect exacto `https://tu-dominio/integrations/google/callback` en Google
Cloud (ver `docs/ingeniero.md`).

### Alternativa: PaaS (Render / Railway / Fly.io)

Más cómodas, pero este stack tiene tres piezas que **no encajan sin trabajo extra**: `pgvector` (en Render
solo en planes pagos), MinIO (no hay S3 gestionado local; hay que sustituirlo por S3 real) y el proxy del
frontend (parametrizar el host interno). No hay un `render.yaml` de un clic: quedaría roto.

## 4. Secretos y credenciales

- El repositorio **no contiene credenciales**: los valores reales viven en `.env` (ignorado por git) o en el
  `.env` del servidor. En el código solo hay marcadores `CAMBIAR_POR_SEGURO`.
- Los compose **exigen** las variables (`${VAR:?…}`), así que no hay contraseñas por defecto utilizables.
- Genera cada secreto con `openssl rand -hex 48`. Rota `DB_PASSWORD`, `REDIS_PASSWORD`,
  `MINIO_ROOT_PASSWORD`, `AI_SERVICE_SECRET`, `JWT_SECRET` y `JWT_REFRESH_SECRET`.

> **Si ya tenías un volumen de Postgres creado con una contraseña anterior**, cambiar `DB_PASSWORD` en el
> `.env` no actualiza el usuario dentro de la base de datos. Opciones:
> - Sin perder datos: `docker exec -it legal-ai-postgres psql -U legal_user -d legal_ai -c "ALTER USER legal_user WITH PASSWORD 'NUEVA_CLAVE';"`
> - O recrear la base (borra datos): `docker compose -f docker-compose.full.yml down -v` y volver a levantar.
> Redis y MinIO no tienen este problema: su credencial es de arranque.

## 5. Antes de exponer en producción

- Revisar `docs/ingeniero.md` (fases 1 y 2): hay correcciones de confidencialidad pendientes (URLs públicas de documentos, borrado real en MinIO/Drive, cifrado de tokens).
- El seed real no está en `npm run db:seed` (es un `echo`): revisar `packages/database/seed-mock.sql`.
- Poner un `OPENAI_API_KEY` real y `COHERE_API_KEY` si aplica.
