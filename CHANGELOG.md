# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-01-XX

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

## [1.1.0] - 2024-01-XX

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

## [1.0.1] - 2024-01-XX

### Fixed

- Cargo Items Now Appear - fixed cargo items missing due to mapping script filtering
- Child Recipe Quantity Calculation - fixed child recipe nodes showing Qty: 1 instead of correct quantities
- Recipe Output Display - fixed recipe output showing raw IDs instead of item names

## [1.0.0] - 2024-01-XX

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
