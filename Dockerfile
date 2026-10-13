FROM node:22-slim AS base
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build

# The Prisma CLI is needed at runtime for `migrate deploy`, so dev dependencies are kept.
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/next.config.mjs ./
USER node
EXPOSE 3000

# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start"]
