FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build


FROM node:22-bookworm-slim AS production-dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force


FROM node:22-bookworm-slim AS runtime
WORKDIR /app

COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

COPY --chown=node:node package.json ./
COPY --chown=node:node .env ./

RUN mkdir -p /app/processing /app/mock-data \
    && chown node:node /app/processing /app/mock-data

USER node

EXPOSE 3000

CMD ["node", "dist/server.js"]