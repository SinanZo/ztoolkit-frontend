FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack pnpm install --frozen-lockfile --prod
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
