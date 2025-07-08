# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0]

### Added

- **Game Icon Integration**: Comprehensive Bitcraft game asset library integration
  - Added 1,500+ game icons covering items, cargo, cosmetics, buildings, tools, and more
  - Icons now display for all calculator item nodes (48x48 pixels)
  - Fallback system using `Unknown.webp` for missing assets
  - Complete icon coverage for all game categories (Items, Cargo, Resources, Cosmetics, Buildings, etc.)

### Improved

- **Visual User Experience**: Enhanced calculator interface with game-authentic visuals
  - Quantity display moved below item title for better layout and readability
  - Icons positioned next to quantity badges using flex layout
  - Visual consistency with game assets throughout the calculator interface
  - Improved parent-child completion logic in recipe trees

### Changed

- **Data Structure Enhancement**: Updated TypeScript interfaces to support icon assets
  - Added `icon_asset_name` property to `Item` and `ItemData` interfaces
  - Updated all node creation logic to include icon asset information
  - Enhanced data flow for proper icon asset name propagation

## [1.5.2]

### Fixed

- **Recipe Switching**: Properly remove all child nodes when switching recipes in CustomNode
  - Recursively find and remove all descendant nodes when recipe changes
  - Clean up orphaned edges from previous recipe selections
  - Prevent accumulation of unused material nodes in flow

## [1.5.1]

### Fixed

- **UI Enhancement**: Round quantity numbers to nearest integer in recipe calculator nodes for better readability

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

- Import path refactoring: Standardized all imports to use `@/*`
