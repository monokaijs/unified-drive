FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN yarn config set network-timeout 300000 && \
    yarn config set registry https://registry.npmjs.org/ && \
    yarn --frozen-lockfile --production=false --network-timeout 300000 && \
    yarn cache clean
COPY . .
RUN yarn compile

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
CMD ["node", "server.js"]
