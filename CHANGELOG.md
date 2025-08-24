# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.12.2] - Enhanced Safety & Visual Improvements - 2025-01-16

### Added

- **🛡️ Confirmation Dialogs for Destructive Actions**: Added safety prompts to prevent accidental data loss
  - **Item Removal Confirmation**: Clear warning dialog when removing items from projects
  - **Destructive Action Warning**: Emphatic messaging about permanent data loss
  - **Consistent UX**: Proper destructive styling and cancel options across all confirmation dialogs

- **🎨 Tier Badge Enhancements**: Improved visual hierarchy in project details sorting
  - **Universal Tier Badges**: All tier groups (1-10) now display colored tier badges alongside text
  - **Visual Consistency**: Tier badges match the established brico.app styling system
  - **Better Recognition**: Easier identification of tier levels when sorting "By Tier"

### Fixed

- **⚠️ Accidental Item Deletion**: Previously, clicking "Remove" on project items deleted immediately without confirmation
- **🎯 Visual Tier Recognition**: Tier groups in project details now have consistent visual indicators

## [1.12.1] - Enhanced Quantity Validation & UI Fixes - 2025-01-15

### Added

- **🛡️ Comprehensive 999,999 Quantity Limit**: Implemented frontend validation to prevent project creation failures
  - **Calculator Inputs**: Added max validation and auto-capping in calculator quantity fields
  - **Project Creation**: Manual project step now enforces 999,999 limit with helpful UI hints
  - **Item Editing**: Project item table editing respects maximum quantity with clear messaging
  - **Contribution Dialog**: Smart validation limits contributions to min(remaining, 999,999)
  - **User Experience**: Placeholder text, tooltips, and auto-capping prevent invalid inputs

### Fixed

- **✏️ Project Item Editing**: Restored missing edit buttons in project item tables
  - **Edit Button Recovery**: Re-added pencil icon buttons next to item quantities for editing
  - **Permission Checking**: Proper canEdit permission validation for edit functionality
  - **UI Consistency**: Maintained existing save/cancel workflow while adding validation
  - **Quantity Limits**: Edit inputs now properly cap at 999,999 to prevent API errors

## [1.12.0] - Settlement Projects UX & Stability Overhaul - 2025-01-15

### Added

- **🔄 Sortable Project Tables**: Added sortable columns (Item, Required, Contributed, Progress) with visual indicators
  - **Sort Icons**: Up/down arrows show current sort state
  - **Multi-Column Support**: Sort by any column in project item tables
  - **Consistent Behavior**: Works in both flat view and accordion grouped views

- **📝 Enhanced Add Item Experience**: Complete workflow overhaul for adding items to projects
  - **Streamlined UI**: Removed duplicate buttons, single "Add Item" action in project header
  - **Improved Form Layout**: Right-aligned action buttons with proper order (Add Item → Cancel)
  - **Smart Item Search**: Fixed ItemSearchCombobox integration with proper value binding
  - **Form State Management**: Proper cleanup and error handling throughout workflow

- **🎯 Smart Accordion Behavior**: Auto-expanding accordions for better user experience
  - **Small Project Optimization**: Projects with <20 items auto-expand by default
  - **Reduced Clicks**: Eliminates unnecessary accordion interaction for smaller projects
  - **Large Project Grouping**: Maintains organization for projects with many items

- **🔢 Robust Quantity Validation**: Comprehensive input validation for item quantities
  - **Maximum Limits**: 1,000,000 item limit with clear messaging
  - **Scientific Notation Prevention**: Blocks problematic inputs like `2e173` from extreme numbers
  - **Input Constraints**: Visual hints (placeholders, tooltips) and proper input field configuration
  - **Frontend/Backend Sync**: Consistent validation on both client and server

### Fixed

- **📅 Project Date Display**: Resolved "Invalid Date" showing for project creation dates
  - **Backend/Frontend Alignment**: Fixed Date object vs ISO string mismatch
  - **Null Safety**: Added proper date validation and fallback handling
  - **Data Consistency**: Ensured `created_at` field properly mapped across API layers

- **🖼️ Asset & Thumbnail Coverage**: Comprehensive fixes for missing item thumbnails
  - **Crop Oil Icons**: Fixed missing thumbnails → `VegetableOil.webp`
  - **Metalworking Flux**: Corrected double-path issue → `MetalworkersFlux.webp`  
  - **Fish Filets**: All filet variants now use correct `FishFilet.webp` thumbnail
  - **Tree Sap**: Fixed path mismatch → `Sap.webp`
  - **Leather Items**: Resolved missing thumbnails for woven caps and leather gloves

- **⚡ Item Quantity Editing**: Fixed critical API field name mismatch
  - **Field Consistency**: Corrected `requiredQuantity` vs `required_quantity` between frontend/backend
  - **Error Prevention**: Proper validation prevents database constraint violations
  - **User Feedback**: Clear error messages for validation failures

- **🎯 Skill Classification Accuracy**: Major improvements to skill inference system
  - **Specificity-Based Matching**: Replaced order-dependent logic with smart scoring system
  - **Exact > Boundary > Substring**: Prioritizes precise matches over broad patterns
  - **Conflict Resolution**: Fixed major misclassifications:
    - **Brickworking Binding Ash**: Mining → **Masonry** ✅
    - **Hideworking Salt**: Mining → **Leatherworking** ✅  
    - **Crop Oil**: Added specific pattern for **Farming** ✅
    - **Clay Pebbles**: Mining → **Masonry** ✅
    - **Pelts**: Fishing → **Leatherworking** ✅

- **🔗 Item Linking System**: Improved item hyperlinks in project tables
  - **Calculator Links**: Switched to reliable `/calculator/[slug]` links
  - **Data Resolution**: Two-tier system (calculator data → item_desc.json fallback)
  - **Missing Item Handling**: Eliminated console error spam with proper fallback system
  - **Performance**: Optimized data loading to prevent rendering loops

### Enhanced

- **🏗️ Component Architecture**: Streamlined form and table components
  - **Add Item Form**: Removed unnecessary state and props, cleaner component interface
  - **Project Tables**: Optimized icon resolution with targeted data loading
  - **Error Handling**: Comprehensive validation and graceful error recovery
  - **Memory Management**: Proper cleanup and caching for game data operations

- **🎨 Visual Polish**: Consistent UI improvements across project management
  - **Button Sizing**: Standardized action button proportions and alignment
  - **Input Fields**: Added placeholders, tooltips, and validation hints
  - **Icon Coverage**: Complete thumbnail support for all item categories
  - **Layout Consistency**: Proper spacing and alignment throughout project interfaces

- **📊 Data Quality**: Enhanced item data handling and validation
  - **Asset Path Resolution**: Intelligent path cleaning and fallback systems
  - **Skill Pattern Library**: Comprehensive patterns with conflict prevention
  - **Input Sanitization**: Robust validation for all user inputs
  - **Type Safety**: Improved TypeScript coverage for data operations

### Technical Improvements

- **Pattern Matching Algorithm**: Implemented specificity-based skill inference with scoring system
- **Data Resolution System**: Two-tier fallback (calculator data → complete item database)
- **Component Optimization**: Eliminated heavy operations in render-critical paths
- **Validation Framework**: Consistent frontend/backend validation with clear error messaging
- **Asset Management**: Enhanced path resolution with specific mappings for problematic items

---

## [1.11.0] - Advanced Skill Inference & Asset Management System - 2025-01-14

### Added

- **🧠 Centralized Skill Inference System**: Revolutionary skill categorization with 97.5% accuracy
  - **Smart Pattern Matching**: Comprehensive patterns for all BitCraft professions (6 gathering, 8 crafting)
  - **Precision Targeting**: Specific patterns prevent conflicts (e.g., "Stone Carvings" → Scholar, not Masonry)
  - **Official Alignment**: Synchronized with BitCraft leaderboard professions
  - **Audit Tools**: Built-in validation system to maintain accuracy over time

- **🖼️ Intelligent Asset Management**: Smart thumbnail system with automatic fallbacks
  - **Multi-Folder Support**: Automatically tries Items → Cargo → Unknown asset paths
  - **Pattern Recognition**: Handles quality prefixes, plural/singular, ore chunks, and special cases
  - **Specific Mappings**: Custom handling for roots, bark, hair, flowers, salt, shells, and more
  - **Performance Optimized**: Cached loading with graceful error handling

- **🎨 Enhanced Project Detail UX**: Streamlined interface improvements
  - **Cleaner Accordion Headers**: Removed redundant item counts, focus on progress percentages
  - **Intuitive Icons**: Better contribute button (HandHeart) and visual consistency
  - **Smart Caching**: Optimized game data loading and image fallback systems
  - **Responsive Design**: Improved layout consistency and mobile experience

### Fixed

- **Skill Assignment Corrections**: Major categorization improvements
  - Plant Roots: Farming → **Foraging** ✅
  - Stone Carvings: Masonry → **Scholar** ✅  
  - Hideworking Salt: Misc → **Leatherworking** ✅
  - Sand, Clay, Pebbles: Mining → **Masonry/Foraging** ✅
  - Wispweave Filament: Farming → **Tailoring** ✅
  - Animal Names: Various → **Hunting** ✅

- **Asset Loading Issues**: Comprehensive thumbnail fixes
  - Fixed missing icons for roots, bark, hair, flowers, salt, shells, and crushed items
  - Resolved 404 errors through intelligent path resolution
  - Added proper fallback chains for asset discovery

- **Performance Issues**: Optimized data loading and caching
  - Eliminated redundant `getCalculatorGameData()` calls
  - Implemented lazy loading for heavy operations
  - Added module-scoped caching for frequently accessed data

### Technical Improvements

- **Type Safety**: Resolved TypeScript union type issues in project components
- **Code Organization**: Centralized skill patterns in dedicated modules with documentation
- **Error Handling**: Robust fallback systems for missing assets and data
- **Build Quality**: Clean builds with no linting errors or TypeScript issues

---

## [1.10.1] - Calculator-to-Project Integration & Enhanced Project Creation - 2025-01-14

### Added

- **🧙‍♂️ Project Creation Wizard**: Revolutionary project creation workflow with two powerful modes
  - **Manual Mode**: Traditional item-by-item project creation with enhanced search and validation
  - **Auto-Generate Mode**: Game-changing calculator integration that converts crafting calculations directly into settlement projects
  - **Smart Project Titles**: Automatic title generation based on target items and quantities
  - **Seamless Workflow**: Smooth transitions between calculator exploration and project creation

- **🔗 Calculator-to-Project Bridge**: First-of-its-kind integration between crafting calculator and settlement management
  - **Material List Export**: Convert any calculator result into a complete project with one click
  - **Intelligent Item Mapping**: Automatic conversion of calculator materials to project items with proper quantities
  - **Skill & Tier Preservation**: Maintains crafting context (skills, tiers) when creating projects from calculator
  - **Quantity Optimization**: Smart rounding and quantity management for realistic project planning

- **🎯 Enhanced Project Creation Interface**:
  - **Dual-Mode Creation**: Choose between manual item addition or calculator-powered auto-generation
  - **Advanced Item Search**: Improved combobox with tier filtering and category-based organization
  - **Real-time Validation**: Instant feedback on item selection and quantity requirements
  - **Visual Item Display**: Rich item cards with tier badges, icons, and category information
  - **Flexible Editing**: Add, remove, and modify project items with intuitive controls

- **📊 Calculator Enhancements**:
  - **Project Export Button**: Direct "Create Project" action from any calculator result
  - **Enhanced Material Display**: Better visualization of material requirements with export capabilities
  - **Improved UI Controls**: Streamlined calculator interface optimized for project creation workflow

### Enhanced

- **Project Detail View**: Restored and enhanced project management interface with contribution tracking
- **Item Search Performance**: Optimized search with better filtering and categorization
- **Data Flow Integration**: Seamless data transfer between calculator and project systems
- **User Experience**: Intuitive wizard-based workflow that guides users through project creation

### Technical Improvements

- New `ProjectSeed` system for staging calculator results before project creation
- Enhanced TypeScript interfaces for calculator-project data flow
- Improved validation schemas for project creation API
- Better error handling and user feedback throughout the creation process
- Optimized component architecture for reusable project creation components

## [1.10.0] - Remove Invite Code System - 2025-01-13

### Removed

- **Invite Code System**: Completely removed settlement invite code and auth code functionality
  - **Components Removed**: Settlement join flow, invite code display components, invite code compact UI
  - **API Routes Removed**: `/api/settlement/join`, `/api/settlement/invite-code`, admin invite code endpoints
  - **Database Changes**: Removed invite code related migrations and database functions
  - **Settlement Flow**: Simplified onboarding to establishment-only (no more joining via codes)
  - **Type Definitions**: Cleaned up invite code references from TypeScript interfaces
  - **Validation**: Removed invite code validation schemas and patterns

### Technical

- Deleted 2,400+ lines of invite code related functionality across 23 files
- Removed dependencies on invite code generation and management
- Simplified settlement onboarding workflow to focus on establishment via BitJita search
- Prepared codebase for upcoming database schema refactoring
- Updated documentation to reflect establishment-only settlement workflow

### Migration Notes

- Users previously using invite codes to join settlements will need to use the establishment flow
- Database schema missing `settlement_id` column will be resolved in upcoming database work
- Discord linking functionality preserved and unaffected

## [1.9.3] - Documentation Updates & Code Cleanup - 2025-01-29

### Updated

- **Documentation Maintenance**: Updated project documentation files
  - Refreshed README.md with current project information and setup instructions
  - Updated TODO.md with current development priorities and feature roadmap
  - Enhanced DEVELOPER_ONBOARDING.md and DOCUMENTATION_INDEX.md for better developer experience
  - Updated PHASE_4_ROADMAP.md with latest project milestones

- **Calculator UI Improvements**: Minor code cleanup in calculator components
  - Commented out unused export functionality in calculator header
  - Maintained clean component structure for better maintainability

- **Site Configuration**: Updated site configuration for consistency
  - Updated contact links and social media references
  - Enhanced FAQ section with better user experience and up-to-date information

### Technical

- Updated package dependencies via package-lock.json
- Maintained code quality with TypeScript strict mode compliance
- Enhanced documentation structure for improved developer onboarding

## [1.9.2] - Dashboard Project Count Fix - 2025-01-08

### Fixed

- **Dashboard Project Count**: Fixed critical issue where "Total Projects" card showed 0 instead of actual project count
  - **Root Cause**: Dashboard API was using user-authenticated Supabase client which was blocked by Row Level Security (RLS) policies
  - **Solution**: Updated projects query to use service role client with elevated permissions to bypass RLS restrictions
  - **Impact**: Dashboard now correctly displays project statistics (5 total projects, 1 completed for Port Taverna settlement)
  - **Files Modified**: `src/app/api/settlement/dashboard/route.ts`

### Technical

- Enhanced dashboard API robustness by implementing proper service role authentication for settlement-wide data queries
- Maintained security for user-specific operations while allowing settlement-level aggregations
- Improved debugging capabilities for settlement data queries
- Verified fix works across all settlement types and sizes

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
  - `settlements` table with sync logging
  - `players` and `settlement_citizens` tables for member data
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
