FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/
RUN corepack enable && corepack pnpm install --frozen-lockfile && npx prisma generate
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
