FROM node:20-slim

# Enable pnpm via Corepack
RUN corepack enable \
 && corepack prepare pnpm@latest --activate

WORKDIR /app

# ─── 2. Install all dependencies (including devDeps) ───────────
COPY package.json package-lock.json ./
RUN pnpm install

# ─── 3. Copy your entire project (including mocks, tests, infra) ─
COPY . .

# ─── 4. (Optional) Smoke-test exec ─────────────────────────────
# If you do have a quick script (e.g. `npm run lint`) you can run it here.
# Otherwise you can skip this and just exit so the image exists for scanning:
CMD ["node", "--version"]
