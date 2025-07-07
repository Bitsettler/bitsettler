# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0]

### Added

- **Loot Table System**: Implemented comprehensive loot table expansion for extraction recipes
  - Extraction recipes now show actual items obtained instead of mysterious "Output" containers
  - **Basic Berry** and **Basic Citric Berry** now properly appear in Strawberry Bush extraction recipes
  - Probability calculations show realistic drop rates (e.g., 8% for Basic Berry, 0.16% for Basic Citric Berry)
- **Enhanced Extraction Recipe System**: Added intelligent resource quantity calculations based on drop probabilities
  - Resource requirements now reflect actual effort needed (e.g., 12.5 Strawberry Bush units for expected berry output)
  - Probability-based calculations for all extraction activities (gathering, mining, chopping, etc.)

### Improved

- **Data Structure Standardization**: Unified all item prefixes to singular form for consistency
  - Changed `items_` → `item_`, `resources_` → `resource_` (cargo already singular)
  - Updated all mapping scripts to use consistent singular naming convention
- **Extraction Recipe Coverage**: All 384 extraction recipes now properly show real items with accurate probabilities
  - Berry gathering shows actual berries instead of loot table containers
  - Wood chopping shows specific bark and log types with proper drop rates
  - Mining operations display actual ores and gems with calculated probabilities
- **Type Safety**: Migrated entire codebase from numeric to string-based item IDs for better data integrity

### Fixed

- **Missing Items in Extraction**: Resolved issue where berry items weren't appearing in extraction recipes
  - Fixed server data interpretation where "T1 Berry Output" items were loot table containers
  - Properly expanded loot tables to show Basic Berry (100% from loot table) and Basic Citric Berry (2% bonus)
- **Build System**: Resolved all TypeScript compilation errors related to ID type changes
  - Updated Item interfaces across all components to use string IDs
  - Fixed type mismatches in calculator, search, and visualization components
  - Ensured production build compatibility

### Technical

- **Loot Table Processing**: Implemented server data cross-referencing between extraction recipes and item lists
  - Added `item_list_id` detection for loot table containers
  - Built comprehensive loot table lookup system (1,740 tables processed)
  - Created probability calculation engine for effective drop rates
- **Script Enhancement**: Updated extraction recipe mapping to handle complex data relationships
  - Added support for multi-stage item resolution (extraction → loot table → actual items)
  - Improved error handling and logging for data processing pipeline
- **Code Quality**: Achieved zero linting warnings and successful production build
  - Resolved all TypeScript strict mode compliance issues
  - Optimized bundle size and build performance

## [1.4.1]

### Fixed

- **Recipe Quantity Calculation**: Fixed quantity updates after node consolidation by removing dependency on compound node IDs and updating the calculation logic to work with the new node structure

## [1.4.0]

### Improved

- **Flow Node Consolidation**: Recipe Flows will now only display one node per item instead of multiple nodes when the item is used in multiple recipes/ sub recipes. Thanks @floofwax for the suggestion!
- **Node Component Consolidation**: Unified `ItemNode` and `MaterialNode` into a single `CustomNode` component, reducing code duplication by ~500 lines
- **Edge Direction Consistency**: Standardized edge direction to flow from materials (source) to crafted items (target)
- **Edge Highlighting Logic**: Fixed edge highlighting to show green when materials are completed and blue when crafted items are hovered
- **Visual Feedback Enhancement**: Added blue border glow effect when nodes are hovered for better user interaction feedback

### Changed

- **Edge Animation**: Disabled default edge animations for cleaner visual presentation
- **Edge Type**: Changed edge type from 'smoothstep' to 'bezier' for smoother visual flow
- **Component Architecture**: Simplified component structure by consolidating duplicate node components

### Technical

- **Code Refactoring**: Removed duplicate `item-node.tsx` and `material-node.tsx` files
- **Type Safety**: Improved TypeScript type safety in edge color management
- **Performance**: Optimized edge color updates with proper change detection

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
