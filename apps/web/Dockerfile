FROM node:22-slim AS builder

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build --workspace @legal-ai/web

FROM nginx:alpine AS runner

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
