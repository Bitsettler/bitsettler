# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.1] - Settlement Layout Consistency - 2025-01-29

### Fixed

- **Settlement Layout Constraints**: Fixed layout width inconsistencies across settlement pages
  - Removed restrictive `container` class from settlement layout that was limiting page width
  - Updated all settlement views (Dashboard, Skills, Treasury, Members, Projects) to use proper `Container` component
  - Implemented consistent layout pattern matching Compendium/Tools pages with responsive padding
  - Applied `space-y-6 py-8` spacing pattern for uniform visual consistency
  - Settlement pages now use full available width with proper responsive design
  - Resolved "skinny" appearance compared to other sections of the application

### Technical

- Modified `src/app/[locale]/settlement/layout.tsx` to remove hard width constraints
- Updated settlement view components to import and use `Container` component:
  - `settlement-dashboard-view.tsx`
  - `settlement-skills-view.tsx` 
  - `settlement-treasury-view.tsx`
  - `settlement-members-view.tsx`
  - `settlement-projects-view.tsx`
- Standardized layout structure across all settlement pages for maintainability

## [1.9.0] - User Profiles & Enhanced UX - 2024-12-28

### Added

- **User Profile System**: Complete localStorage-based profile system for settlement users
  - 4-step profile setup integrated into settlement onboarding flow
  - Display name, contact info (Discord/in-game), and bio management
  - Optional profession-based avatars with 18 BitCraft professions
  - Color theme customization with profession fallbacks
  - Activity tracking and statistics (settlements connected, app usage)
  - Profile management via dropdown in settlement header
  - Sign out functionality to clear all local data

- **Profession Avatar System**: Visual identity system for settlement members
  - 18 profession-specific avatar options (Alchemy, Combat, Farming, etc.)
  - Flexible choice between profession avatars or color themes
  - Graceful fallbacks from profession images to colored initials
  - Consistent avatar display across all settlement interfaces
  - Professional color schemes for each BitCraft profession

- **Enhanced Settlement Connection Flow**: Improved onboarding experience
  - Multi-stage progress indicators during settlement connection
  - Real-time sync status with detailed messaging and ETA
  - Global sync status indicator visible across settlement interface
  - Comprehensive error handling with retry mechanisms
  - "Profile setup in progress..." clear status messaging

### Fixed

- **Skills Analytics**: Replaced static mock data with real-time settlement skills analytics
  - Created `/api/settlement/skills` endpoint with live data aggregation
  - Real skill statistics: total skills, average levels, profession distribution
  - Top skills analysis and skill level distribution charts
  - Comprehensive loading states and error handling

- **UI/UX Improvements**: Enhanced interface consistency and user experience
  - Scoped profile system to settlement area only (removed from main site navigation)
  - Fixed member detail page layout width issues
  - Improved breadcrumb navigation with proper translation keys
  - Settlement-specific header with clean navigation and profile access

### Technical

- **New Components**:
  - `ProfessionAvatar` - Smart avatar component with profession/color fallbacks
  - `SettlementHeader` - Settlement-specific navigation with profile integration
  - `UserProfileManager` - Complete profile editing interface
  - `SettlementConnectionProgress` - Detailed connection progress display

- **New Constants & Utilities**:
  - `constants/professions.ts` - 18 BitCraft professions with colors and descriptions
  - `hooks/use-user-profile.ts` - Profile state management with localStorage
  - `public/assets/ProfessionAvatars/` - Directory structure for profession images

- **Enhanced Components**:
  - `SettlementOnboarding` - Integrated 4-step profile setup
  - `SettlementSkillsView` - Real data integration replacing mock data
  - Main header component cleaned up with profile functionality moved to settlement area

## [1.8.0] - Settlement Management System

### Added

- **Settlement Member Detail Pages**: Comprehensive member profiles accessible by clicking member names
  - Individual member skill statistics and progress visualization
  - Settlement permissions display (inventory, build, officer, co-owner levels)
  - Activity timeline showing join date and last seen information
  - Top skills ranking with visual progress bars
  - Member profile information including entity ID and profession

- **6-Digit Invite Code System**: Generate and share alphanumeric settlement invite codes
  - ABC123 format codes (3 letters + 3 numbers, no spaces)
  - Compact dropdown display in settlement dashboard header
  - Copy, regenerate, and share functionality
  - localStorage persistence for invite codes
  - Large detailed display during settlement onboarding

- **Settlement Management Interface**: Dedicated administration page
  - Non-navigated page accessible via gear icon from dashboard
  - Settlement switching and administrative controls
  - Current settlement information and data management options
  - System status and sync information display

- **Settlement Onboarding Flow**: Streamlined settlement selection process
  - BitJita API-powered settlement search and selection
  - Local settlement selection persistence
  - Invite code generation upon settlement selection

### Improved

- **Data Architecture**: Implemented polling/caching system eliminating real-time API calls
  - 3-tier data fallback: Local Database → BitJita API → Demo Data
  - Cache-only member detail API (Local Database → 404 if not cached)
  - Sub-100ms response times for cached settlement data
  - Rate limit compliance and API etiquette with external services

- **Next.js 15 Compatibility**: Updated for latest Next.js App Router patterns
  - Fixed async params handling in dynamic routes
  - Resolved route conflicts between [id] and [memberId] patterns
  - Updated API routes for Next.js 15 compatibility

### Technical

- **Database Schema**: Comprehensive settlement data caching infrastructure
  - `settlements_master` table with sync logging
  - `settlement_members` and `settlement_citizens` tables for member data
  - `settlement_member_details` view for optimized member queries
  - Auto-updating top profession triggers and sync audit trails

- **BitJita API Integration**: Background synchronization services
  - Settlement master list sync (every 30 minutes)
  - Member and citizen data sync (every 20 minutes)
  - Comprehensive error handling and sync logging
  - Sync orchestration service with rate limiting

- **API Architecture**: Zero real-time external API calls in user-facing endpoints
  - Dashboard API: 3-tier fallback (Local DB → Demo Data)
  - Members List API: 3-tier fallback (Local DB → Demo Data)
  - Member Detail API: Cache-only (Local DB → 404 if not cached)
  - Settlement Search API: 2-tier (Local DB → BitJita API)

## [1.7.0]

### Added

- **Clickable Recipe Navigation**: Recipe names in item info panel are now clickable links
  - Click any recipe in the "Usage" section to navigate to that recipe's output item
  - Maintains locale-aware routing using next-intl Link component
  - Enhanced hover styling with consistent accent colors throughout the application

### Improved

- **Search User Experience**: Enhanced search interface with better visibility
  - Increased item icons from 24px to 32px for improved readability
  - Fixed search dropdown width issues to prevent truncation of long item names
  - Auto-sizing combobox popover that adapts to content width

- **Icon Path Data Quality**: Fixed malformed icon asset paths in game data
  - Cleaned up duplicated "GeneratedIcons/Other/GeneratedIcons" path prefixes
  - Added fallback handling for missing deed icons (AncientDeed.webp doesn't exist)
  - All deed items now use proper fallback Unknown.webp icon

- **UI Consistency and Polish**: Streamlined interface elements for better user experience
  - Hidden tier badges for items with tier -1 (items that don't have tiers like deeds)
  - Removed rarity badges from flow nodes for cleaner visual presentation
  - Applied consistent hover styling using `hover:bg-accent/50 hover:text-accent-foreground`

### Fixed

- **Image Loading Issues**: Resolved 404 errors for missing item icons
  - Fixed deed items that were pointing to non-existent AncientDeed.webp file
  - Corrected malformed paths that prevented proper image loading
  - Regenerated all item data files (items.json, cargo.json, resources.json) with cleaned paths

### Technical

- **Data Processing Enhancement**: Updated item mapping scripts with improved error handling
  - Added `cleanIconAssetPath` function to detect and fix common path issues
  - Enhanced data generation pipeline to prevent future path corruption
  - Automated cleanup of icon asset references during data conversion

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
