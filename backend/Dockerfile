# ============================================
# Stage 1: Builder
# ============================================
FROM node:22-slim AS builder

RUN apt-get update -y && apt-get install -y wget curl openssl libssl-dev

ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

RUN npm run build

# ============================================
# Stage 2: Production
# ============================================
FROM node:22-slim

RUN apt-get update -y && apt-get install -y openssl wget

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Tự động đồng bộ DB -> Nạp seed -> Chạy server
CMD ["sh", "-c", "npx prisma db push && node prisma/seed.mjs && node dist/main"]