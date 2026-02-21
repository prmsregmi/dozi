# Frontend

React monorepo for Dozi web application.

## Structure

- `apps/web` - Main web app (React + Vite)
- `packages/shared` - Shared types and utilities
- `packages/api-client` - Backend API client
- `packages/ui` - Shared React components

## Setup

Install dependencies:

```bash
cd frontend
pnpm install
```

Configure environment (`apps/web/.env`):

```bash
VITE_API_URL=http://localhost:8000
```

Start development server:

```bash
pnpm dev
```

App runs at `http://localhost:3000`

## Available Scripts

```bash
pnpm dev          # Start dev server
pnpm build        # Build all packages
pnpm type-check   # Run TypeScript compiler
pnpm lint         # Run ESLint
```
