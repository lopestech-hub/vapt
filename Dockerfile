# ─── Stage 1: Build do Frontend ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --legacy-peer-deps
COPY frontend/ .
RUN npm run build

# ─── Stage 2: Build do Backend ────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma ./prisma
RUN npx prisma generate
COPY backend/ .
RUN npm run build

# ─── Stage 3: Imagem final ────────────────────────────────────────────────────
FROM node:20-alpine
ENV TZ=America/Sao_Paulo
WORKDIR /app

# Copia artefatos do backend
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/package.json ./
COPY --from=backend-builder /app/backend/prisma ./prisma

# Frontend buildado servido como estático pelo backend
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
