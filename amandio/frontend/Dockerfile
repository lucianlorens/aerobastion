# Multi-stage Dockerfile for Next.js
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install build deps reliably (use npm ci when lockfile present)
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi

# Copy source and build
COPY . .
RUN npm run build

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only the necessary artifacts from builder

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
