# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FeedNav is a restaurant discovery and recommendation platform for Taipei, Taiwan. It consists of three main components:

- **feednav-fe**: Next.js 15 frontend with React 19, TailwindCSS, TanStack Query, and Leaflet maps
- **feednav-serverless**: Hono.js REST API running on Cloudflare Workers with D1 database
- **feednav-data-fetcher**: Python data collection pipeline using Google Places API with AI-powered classification

## Common Commands

### Frontend (feednav-fe)

```bash
pnpm dev                  # Start dev server with Turbopack (localhost:3000)
pnpm build                # Production build
pnpm lint                 # Run ESLint
pnpm lint:fix             # Fix ESLint issues
pnpm format               # Format with Prettier
pnpm type-check           # TypeScript validation
pnpm deploy               # Deploy to Cloudflare Workers (OpenNext.js)
```

### Backend API (feednav-serverless)

```bash
pnpm dev                  # Start local Wrangler dev server (localhost:8787)
pnpm test                 # Run Vitest tests
pnpm test:coverage        # Generate coverage report
pnpm lint                 # Run ESLint
pnpm lint:fix             # Fix ESLint issues
pnpm format               # Format with Prettier
pnpm type-check           # TypeScript validation
pnpm deploy               # Deploy to preview environment
pnpm deploy:production    # Deploy to production
```

### Data Fetcher (feednav-data-fetcher)

```bash
python main.py                              # Collect restaurant data
python integrate_data.py <json_file> <db>   # Import data to database
./batch_integration.sh                      # Batch integration
```

## Architecture

```
┌─────────────────────────┐
│   feednav-fe            │
│   (Next.js Frontend)    │
└────────────┬────────────┘
             │ API calls
             ▼
┌─────────────────────────┐
│  feednav-serverless     │
│  (Hono/Workers API)     │
│  api.feednav.cc         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  Cloudflare D1/KV/R2    │
└────────────▲────────────┘
             │ fed by
┌─────────────────────────┐
│ feednav-data-fetcher    │
│ (Python Pipeline)       │
└─────────────────────────┘
```

### Backend Structure (feednav-serverless/src/)

- `index.ts` - Main entry, route definitions
- `handlers/` - Route handlers (auth, restaurants, favorites, visits, oauth)
- `middleware/` - CORS, auth, rate limiting, access logging
- `services/` - Business logic layer
- `repositories/` - Data access layer (D1 queries)
- `mappers/` - Data transformation between layers
- `utils/` - JWT, hashing, validators, OAuth helpers

### Frontend Structure (feednav-fe/src/)

- `app/` - Next.js App Router pages
- `components/` - React components (ui/, layout/, features/)
- `hooks/` - Custom React hooks
- `lib/` - Utilities (api-client, location helpers)
- `queries/` - TanStack Query hooks
- `types/` - TypeScript definitions

### Database Schema (feednav-serverless/schema.sql)

Key tables: `restaurants`, `users`, `user_favorites`, `user_visited_restaurants`, `tags`, `restaurant_tags`, `social_accounts`

## Code Standards

- **TypeScript**: Strict mode, full type coverage, minimize `any`
- **Naming**: camelCase for functions/variables, PascalCase for components/types
- **Imports**: Use path aliases (`@/*`) for cleaner imports
- **Prettier**: No semicolons, single quotes, 100 char line width
- **ESLint**: No console.log (except warn/error), unused variables prefixed with `_`

## Environment Configuration

### Backend (wrangler.toml)

Three environments configured:
- `development` - Local testing
- `preview` (api-preview.feednav.cc) - Staging
- `production` (api.feednav.cc) - Live

### Frontend (.env.local)

Required variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

## Documentation

Detailed docs available in `/docs/`:
- `code-standards.md` - Unified coding standards
- `feednav-fe-fixes.md` - Frontend improvement tracking
- `feednav-serverless-fixes.md` - Backend improvement tracking
- `implementation-checklist.md` - Prioritized task list
- `cicd-environment-setup.md` - GitHub Actions configuration
