# BitCraft.Guide - Project Overview

## About

BitCraft.Guide is a comprehensive crafting guide and recipe visualizer for the BitCraft game. It provides players with an intuitive interface to explore items, recipes, and crafting dependencies through interactive visualizations.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: SpacetimeDB integration via `@clockworklabs/spacetimedb-sdk`
- **UI Framework**: shadcn/ui + Radix UI components
- **Styling**: Tailwind CSS
- **Flow Visualization**: React Flow (@xyflow/react) with Dagre.js
- **Internationalization**: next-intl

## Architecture: Data > Page > View

The project follows a strict three-layer architecture pattern:

### 1. Data Layer (`src/lib/spacetime-db/`)

The pseudo-backend that handles all data operations:

```
src/lib/spacetime-db/
├── modules/
│   ├── items/
│   │   ├── commands/      # Single-purpose functions
│   │   ├── flows/         # Complex multi-command operations
│   │   └── *.ts           # Feature-specific utilities
│   ├── cargo/
│   ├── resources/
│   ├── recipes/
│   └── search/            # Cross-entity search
├── shared/
│   ├── dtos/              # Data transfer objects
│   └── utils/             # Shared utilities
└── index.ts
```

**Principles:**
- Each command/flow gets its own file
- Commands are simple, single-purpose functions
- Flows combine multiple commands for complex operations
- Modules mirror game database schemas

### 2. Page Layer (`src/app/[locale]/`)

Handles routing and data orchestration:
- Uses Next.js App Router
- Calls data layer flows/commands
- Manages internationalization
- Passes processed data to views

### 3. View Layer (`src/views/`)

Pure presentation components organized by feature:
- 1:1 representation of UI screens
- Feature-based organization (`calculator-views/`, `cargo-views/`)
- Consumes data from pages
- Handles user interactions

## Core Features

- **Item Search**: Cross-entity search with filtering
- **Recipe Visualization**: Interactive flow diagrams
- **Quantity Calculator**: Material requirement calculations
- **Multi-language Support**: Built-in i18n
- **Responsive Design**: Mobile-first approach

## Data Integration

- **Real-time Data**: SpacetimeDB integration
- **Type Safety**: Auto-generated TypeScript bindings (`src/data/bindings/`)
- **Game Schemas**: Direct mapping to BitCraft database tables

## Development Guidelines

### File Organization
- Avoid re-exporting from index files
- Import explicitly from actual file locations
- Each function gets its own file
- Feature-based directory structure

### Code Principles
- TypeScript strict mode enforcement
- Component reusability through shadcn/ui
- Clean separation of concerns
- Pure functions where possible

### Build & Development
- **Dev Server**: `npm run dev` (with Turbopack)
- **Linting**: ESLint with Next.js rules
- **Formatting**: Prettier with import organization
- **Type Checking**: Built-in TypeScript validation

## Design System

### UI Components
- **Base**: shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Consistent icon library
- **Responsive**: Mobile-first breakpoints

### Color Scheme
- Dark mode optimized
- Game-themed color palette
- Accessibility-compliant contrast ratios

### Typography
- Clear hierarchy
- Consistent spacing
- Readable font choices

## Best Practices

### Development
- Always prefer editing existing files over creating new ones
- Don't create documentation files unless explicitly requested
- Follow the Data > Page > View pattern strictly
- Keep components pure and focused

### Code Quality
- Use TypeScript for type safety
- Write descriptive commit messages
- Test critical functionality
- Maintain clean imports

### Performance
- Leverage Next.js optimizations
- Minimize bundle size
- Optimize images and assets
- Use proper caching strategies

## Detailed Project Structure

### Root Level
```
bitcraft.guide-web-next/
├── src/                       # Main source code
├── public/                    # Static assets (images, icons)
├── messages/                  # Internationalization files
├── raw-data/                  # Game asset files
├── bins/                      # WASM binaries for SpacetimeDB
├── components.json           # shadcn/ui configuration
├── next.config.ts            # Next.js configuration
├── package.json              # Dependencies and scripts
└── PROJECT_OVERVIEW.md       # This documentation
```

### Source Code Structure (`src/`)

#### 1. Data Layer (`src/lib/spacetime-db-new/`)
The pseudo-backend following strict architectural patterns:

```
spacetime-db-new/
├── modules/                   # Game entity modules
│   ├── items/
│   │   ├── commands/          # Single-purpose functions
│   │   │   ├── get-all-items.ts
│   │   │   ├── get-item-by-slug.ts
│   │   │   └── index.ts       # Command exports
│   │   └── flows/             # Multi-command operations
│   │       ├── get-item-statistics.ts
│   │       └── index.ts       # Flow exports
│   ├── cargo/                 # Cargo/transportation entities
│   ├── resources/             # Harvestable resources
│   ├── recipes/               # Crafting recipes
│   ├── equipment/             # Equipment items
│   ├── weapons/               # Weapon items
│   ├── tools/                 # Tool items
│   ├── buildings/             # Building structures
│   ├── collectibles/          # Collectible items
│   ├── search/                # Cross-entity search
│   └── calculator/            # Recipe calculation logic
└── shared/
    ├── dtos/                  # Data transfer objects
    ├── utils/                 # Shared utilities
    └── assets.ts              # Asset management
```

#### 2. Page Layer (`src/app/[locale]/`)
Next.js App Router with internationalization:

```
app/[locale]/
├── layout.tsx                 # Root layout with providers
├── page.tsx                   # Home page
├── compendium/                # Game data browser
│   ├── [tag]/                 # Dynamic tag pages
│   │   ├── [slug]/            # Individual item pages
│   │   │   ├── (tabs)/        # Tab-based sub-pages
│   │   │   │   ├── obtain/    # How to obtain item
│   │   │   │   ├── used-in/   # What uses this item
│   │   │   │   └── construction/ # Construction recipes
│   │   │   ├── layout.tsx     # Item detail layout
│   │   │   └── page.tsx       # Item overview
│   │   └── page.tsx           # Tag listing page
│   ├── buildings/             # Building categories
│   ├── cargo/                 # Cargo management
│   ├── equipment/             # Equipment browser
│   ├── resources/             # Resource browser
│   └── tools/                 # Tool browser
├── calculator/                # Recipe calculator
│   ├── [slug]/                # Item-specific calculations
│   └── page.tsx               # Calculator index
└── professions/               # Skill/profession pages
```

#### 3. View Layer (`src/views/`)
Feature-based UI components:

```
views/
├── home-views/                # Homepage components
├── compendium-views/          # Data browser views
├── calculator-views/          # Calculator interface
│   ├── components/            # Calculator-specific components
│   └── calculator-flow-view.tsx # React Flow visualization
├── item-views/                # Individual item displays
├── cargo-views/               # Cargo management UI
├── equipment-views/           # Equipment browser UI
├── resource-views/            # Resource browser UI
├── buildings-views/           # Building browser UI
├── tools-views/               # Tool browser UI
└── weapon-views/              # Weapon browser UI
```

#### 4. Component Layer (`src/components/`)
Reusable UI building blocks:

```
components/
├── ui/                        # shadcn/ui base components
│   ├── button.tsx
│   ├── card.tsx
│   ├── table.tsx
│   └── ...                    # All shadcn components
├── custom-react-flow-nodes/   # React Flow customizations
├── icons/                     # Custom icon components
├── header.tsx                 # Site header
├── footer.tsx                 # Site footer
├── search-form.tsx            # Global search
└── theme-provider.tsx         # Theme management
```

#### 5. Supporting Infrastructure

**Data Integration (`src/data/`)**
```
data/
├── bindings/                  # Auto-generated TypeScript bindings
├── global_schema.json         # Game database schema
└── global_tables.json         # Game database tables
```

**Configuration (`src/`)**
```
src/
├── i18n/                      # Internationalization setup
├── hooks/                     # Custom React hooks
├── contexts/                  # React contexts
├── constants/                 # Application constants
├── config/                    # Site configuration
└── middleware.ts              # Next.js middleware
```

## Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Open [http://localhost:3000](http://localhost:3000)

For detailed development instructions, refer to the specific feature documentation in the codebase.