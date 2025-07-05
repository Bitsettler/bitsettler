# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2]

### Improved

- Import path refactoring: Standardized all imports to use `@/*` convention for better maintainability

### Technical

- Updated tsconfig.json to map `@/*` to `./src/*` for consistent import paths
- Refactored all component imports to use the new convention
- Improved code organization and maintainability

## [1.3.1]

### Added

- New tree-view-icon favicon and app icon with dynamic generation

### Fixed

- Middleware configuration to properly handle dynamic favicon/icon generation

## [1.3.0]

### Added

- Debug mode: Show item and recipe IDs in nodes when NODE_ENV is 'development'
- Toast notification system for user feedback (using shadcn/ui Sonner) with full internationalization support
- Helper text and toast for minimum craftable quantity in the calculator

### Improved

- Quantity input now defaults to the recipe's output amount
- Users cannot set a quantity below the recipe's output; clear feedback is provided
- UX: Users can freely type in the quantity field, with validation and correction on blur

### Fixed

- Material requirements now correctly scale with recipe output (e.g., 1 plank for 10 buckets)
- Child and descendant node quantities are now accurate for all recipes

## [Unreleased]

## [1.2.0]

### Added

- Full internationalization (i18n) support with English, French, and Spanish
- Language switcher component in the header
- Comprehensive translation files for all UI text
- Type exports for locale and language types
- Translated metadata for SEO

### Changed

- Replaced all hardcoded UI text with translation keys
- Updated metadata generation to use translations
- Improved type safety with exported locale types

### Technical

- Added `next-intl` for internationalization
- Created translation files: `messages/en.json`, `messages/fr.json`, `messages/es.json`
- Added type exports in `src/i18n/config.ts`
- Updated all components to use translation hooks

## [1.1.0]

### Added

- Enhanced Info Panel with item descriptions and improved badge styling
- Material Node Recipe Support - material nodes now support recipe selection
- Improved Layout Algorithm - switched from depth-first to breadth-first ranking
- Enhanced Search Experience with virtualization for fast search

### Changed

- Better recipe requirement display with proper lookup tables from game data
- More compact node spacing in recipe tree visualization

### Fixed

- Complete Cargo Item Support - fixed cargo items missing from the app
- Recipe Requirements Database - built comprehensive lookup tables from game data
- Recipe Quantity Calculation - fixed child recipe nodes showing incorrect quantities
- Recipe Output Display - fixed showing raw IDs instead of item names
- Recipe Requirements Visibility - fixed empty strings for nodes beyond 2nd level

## [1.0.1]

### Fixed

- Cargo Items Now Appear - fixed cargo items missing due to mapping script filtering
- Child Recipe Quantity Calculation - fixed child recipe nodes showing Qty: 1 instead of correct quantities
- Recipe Output Display - fixed recipe output showing raw IDs instead of item names

## [1.0.0]

### Added

- Initial release of Bitcraft.Guide
- Crafting calculator with React Flow visualization
- Item search and selection functionality
- Recipe requirement calculations
- Dark/light theme support
- Responsive design with Tailwind CSS
- shadcn/ui components integration
- Next.js 15 with App Router
- TypeScript support
- Site configuration system
- Footer with social links and disclaimers
- Interactive Recipe Visualizer with flow diagrams
- Quantity Calculator with automatic recipe scaling
- Comprehensive Item Database with detailed information
- Multi-language Support for English, French, and Spanish
- Modern Responsive UI built with shadcn/ui components
- Real Game Data Integration using actual BitCraft server files
- Performance Optimized with virtualized search and efficient data structures
