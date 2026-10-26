# Giai đoạn 1: Build
FROM node:22-slim AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Giai đoạn 2: Chạy Production
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Copy các file cần thiết cho standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# Bắt buộc phải chạy server.js (không phải npm run start)
CMD ["node", "server.js"]