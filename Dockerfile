# KiranIA OS — production image (Express API + built SPA, served by one process)
# Node 24 runs server.ts directly via native TypeScript stripping, so the server
# needs no separate compile step; only the Vite frontend is built.
FROM node:24-slim AS build
WORKDIR /app

# Install with the lockfile first for a reproducible, cache-friendly layer.
COPY package.json package-lock.json ./
RUN npm ci

# Build the SPA into dist/. Installing dev deps again here is intentional: the
# Vite toolchain is a devDependency.
COPY . .
RUN npm run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# server.ts + src/ are executed through Node's TypeScript stripping.
COPY server.ts tsconfig.json ./
COPY src ./src
COPY litellm_config.yaml ./
COPY --from=build /app/dist ./dist
# The runtime store directory. Mount a volume here to keep local persistence.
RUN mkdir -p data

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.ts"]
