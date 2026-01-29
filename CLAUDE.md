# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FeedNav is a restaurant discovery and recommendation platform for Taipei, Taiwan. It uses a **Turborepo monorepo** structure with the following components:

### Apps
- **apps/web**: Next.js 15 frontend with React 19, TailwindCSS, TanStack Query, and Leaflet maps
- **apps/mobile**: React Native / Expo app with Tamagui UI (cross-platform iOS/Android)

### Packages (Shared)
- **packages/shared**: Shared types, constants, and API client factory
- **packages/config**: Tamagui theme configuration (tokens, themes)
- **packages/ui**: Shared UI components (Button, Card, RestaurantCard, etc.)

### Services
- **feednav-serverless**: Hono.js REST API running on Cloudflare Workers with D1 database
- **feednav-data-fetcher**: Python data collection pipeline using Google Places API

## Common Commands

### Root (Turborepo)

```bash
pnpm dev                  # Start all dev servers
pnpm dev:web              # Start web dev server only
pnpm dev:mobile           # Start mobile dev server only
pnpm dev:api              # Start API dev server only
pnpm build                # Build all packages
pnpm lint                 # Lint all packages
pnpm type-check           # Type check all packages
```

### Web (apps/web)

```bash
cd apps/web
pnpm dev                  # Start dev server with Turbopack (localhost:3000)
pnpm build                # Production build
pnpm deploy               # Deploy to Cloudflare Workers (OpenNext.js)
```

### Mobile (apps/mobile)

```bash
cd apps/mobile
pnpm dev                  # Start Expo dev server
pnpm ios                  # Start iOS simulator
pnpm android              # Start Android emulator
pnpm build:preview        # Build for internal testing
pnpm build:production     # Build for app stores
```

### Backend API (feednav-serverless)

```bash
cd feednav-serverless
pnpm dev                  # Start local Wrangler dev server (localhost:8787)
pnpm test                 # Run Vitest tests
pnpm deploy               # Deploy to preview environment
pnpm deploy:production    # Deploy to production
```

### Data Fetcher (feednav-data-fetcher)

```bash
python main.py                              # Collect restaurant data
python integrate_data.py <json_file> <db>   # Import data to database
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
├──────────────────────────┬──────────────────────────────┤
│   apps/web               │   apps/mobile                │
│   (Next.js 15)           │   (React Native / Expo)      │
│   - React 19             │   - React 18.3               │
│   - TailwindCSS          │   - Tamagui                  │
│   - Leaflet Maps         │   - react-native-maps        │
└──────────────────────────┴──────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │   packages/* (shared)   │
              │   - @feednav/shared     │
              │   - @feednav/config     │
              │   - @feednav/ui         │
              └────────────┬────────────┘
                           │ API calls
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  feednav-serverless                      │
│                  (Hono/Workers API)                      │
│                  api.feednav.cc                          │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Cloudflare D1/KV/R2                         │
└─────────────────────────────────────────────────────────┘
```

## Project Structure

```
FeedNav/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/
│   │       ├── app/            # App Router pages
│   │       ├── components/     # React components
│   │       ├── hooks/          # Custom hooks
│   │       ├── lib/            # Utilities
│   │       └── queries/        # TanStack Query hooks
│   └── mobile/                 # React Native app
│       └── src/
│           ├── app/            # Expo Router pages
│           ├── components/     # Mobile components
│           └── lib/            # Mobile utilities
├── packages/
│   ├── shared/                 # Shared logic
│   │   └── src/
│   │       ├── types/          # TypeScript types
│   │       ├── constants/      # API endpoints, config
│   │       └── api/            # API client factory
│   ├── config/                 # Tamagui theme
│   │   └── src/
│   │       ├── tokens.ts       # Design tokens
│   │       ├── themes.ts       # Light/dark themes
│   │       └── tamagui.config.ts
│   └── ui/                     # Shared UI components
│       └── src/
│           ├── Button.tsx
│           ├── Card.tsx
│           ├── RestaurantCard.tsx
│           └── ...
├── feednav-serverless/         # Cloudflare Workers API
├── feednav-data-fetcher/       # Python data pipeline
├── package.json                # Workspace root
├── pnpm-workspace.yaml         # pnpm workspace config
└── turbo.json                  # Turborepo config
```

### Backend Structure (feednav-serverless/src/)

- `index.ts` - Main entry, route definitions
- `handlers/` - Route handlers (auth, restaurants, favorites, visits, oauth)
- `middleware/` - CORS, auth, rate limiting, access logging
- `services/` - Business logic layer
- `repositories/` - Data access layer (D1 queries)
- `mappers/` - Data transformation between layers
- `utils/` - JWT, hashing, validators, OAuth helpers

### Database Schema (feednav-serverless/schema.sql)

Key tables: `restaurants`, `users`, `user_favorites`, `user_visited_restaurants`, `tags`, `restaurant_tags`, `social_accounts`

## Code Standards

- **TypeScript**: Strict mode, full type coverage, minimize `any`
- **Naming**: camelCase for functions/variables, PascalCase for components/types
- **Imports**: Use path aliases (`@/*`) for cleaner imports
- **Prettier**: No semicolons, single quotes, 100 char line width
- **ESLint**: No console.log (except warn/error), unused variables prefixed with `_`

## Shared Packages

### @feednav/shared
Contains TypeScript types, API constants, and the `createApiClient` factory function that both web and mobile apps use.

### @feednav/config
Contains Tamagui theme configuration including:
- `tokens` - Colors, spacing, sizes, radii
- `themes` - Light and dark theme definitions
- `config` - Complete Tamagui config

### @feednav/ui
Contains cross-platform UI components built with Tamagui:
- `Button`, `Card`, `Badge`, `Input`
- `RestaurantCard` - Restaurant display card

## Environment Configuration

### Backend (wrangler.toml)

Three environments configured:
- `development` - Local testing
- `preview` (api-preview.feednav.cc) - Staging
- `production` (api.feednav.cc) - Live

### Web Frontend (.env.local)

Required variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Mobile (app.json)

Configure Google Maps API keys in `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey`

## Documentation

Detailed docs available in `/docs/`:
- `techstack/` - Technology stack documentation
  - `react-native.md` - Mobile app technical planning
  - `frontend.md` - Web frontend details
  - `backend.md` - API backend details
  - `cicd.md` - CI/CD pipeline setup
