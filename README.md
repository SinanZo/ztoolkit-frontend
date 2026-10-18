# ZToolKit — Multilingual Online SaaS Productivity Platform

Official repository for [ZToolKit.net](https://ztoolkit.net), a high-performance multilingual online utility platform scaling to 100+ browser-based and server-backed productivity tools (PDF manipulation, media converters, code tools, generators).

---

## ⚙️ Architecture & Tech Stack

- **Frontend**: React 18, Vite 5, React Router 6, Tailwind CSS v3.4
- **Localization**: `i18next` + `react-i18next` with automatic RTL switching (English & Arabic supported)
- **Backend**: Node.js, Express, Stripe SDK
- **Database & ORM**: PostgreSQL, Prisma ORM (with local dev fallback)
- **Package Manager**: `pnpm` (standardized across the repository)
- **Testing & Quality**: Vitest, React Testing Library, ESLint flat config, Playwright E2E

---

## 🚀 Quickstart & Developer Setup

### Prerequisites

- Node.js `>= 20.x`
- `pnpm` `>= 9.x` (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker & Docker Compose (optional for local PostgreSQL)

### 1. Clone & Switch to Foundation Branch

```bash
git clone https://github.com/SinanZo/ztoolkit-frontend.git
cd ztoolkit-frontend
git switch recovery/ztoolkit-foundation
```

### 2. Configure Environment

Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

*Note: `.env` is ignored by Git and should never contain production secrets.*

### 3. Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
pnpm --dir backend install
```

### 4. Run Development Servers

```bash
# Terminal 1: Start Frontend (http://localhost:5173)
pnpm dev

# Terminal 2: Start Backend (http://localhost:3000)
pnpm --dir backend dev
```

---

## 🧪 Testing & Verification

```bash
# Run frontend unit & smoke tests
pnpm test

# Run ESLint check
pnpm lint

# Build production bundle
pnpm build

# Run backend unit & contract tests
pnpm --dir backend test
```

---

## 🐳 Running with Docker Compose (Local Database & Backend)

```bash
docker compose up -d postgres
cd backend && npx prisma db push
```

---

## 🛡️ Security Guidelines

- Never commit `.env` or secrets to Git.
- Unsigned Stripe webhooks are strictly rejected in `NODE_ENV=production`.
- Development price placeholders cannot be used in production billing.