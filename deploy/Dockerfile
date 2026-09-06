FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=staging

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund

COPY apps ./apps
COPY content ./content
COPY packages ./packages
COPY registry ./registry
COPY scripts/start-staging-service.mjs ./scripts/start-staging-service.mjs

USER node
EXPOSE 4173 8787

CMD ["node", "scripts/start-staging-service.mjs"]
