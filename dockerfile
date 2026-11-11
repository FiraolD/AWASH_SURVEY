# ---------- 1. deps ----------
    FROM node:20-alpine AS deps
    RUN apk add --no-cache libc6-compat
    WORKDIR /app
    
    COPY package.json package-lock.json ./
    RUN npm ci
    
    # ---------- 2. builder ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # Build-time env values (overridden at runtime by the container env)
    ENV NEXT_TELEMETRY_DISABLED=1
    RUN npm run build
    
    # ---------- 3. runner ----------
    FROM node:20-alpine AS runner
    WORKDIR /app
    
    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    ENV PORT=3090
    ENV HOSTNAME=0.0.0.0
    
    RUN addgroup --system --gid 1001 nodejs \
     && adduser  --system --uid 1001 nextjs
    
    # Static assets, standalone server bundle, and public files
    COPY --from=builder /app/public       ./public
    COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
    COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
    
    # Migration script + its runtime deps so the container can self-migrate
    COPY --from=builder /app/db             ./db
    COPY --from=builder /app/scripts        ./scripts
    COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
    
    USER nextjs
    EXPOSE 3090
    
    # Container health check — pings the login page
    HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
      CMD wget -qO- http://127.0.0.1:3090/am/login >/dev/null 2>&1 || exit 1
    
    CMD ["node", "server.js"]