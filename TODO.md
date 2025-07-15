# TODO - Calculator Refactor & Improvements

## 🏗️ **Proposed Module-based DTO Architecture Refactor**

### **Overview**

Refactor the current monolithic `calculator-dtos.ts` into module-specific files to improve maintainability, scalability, and alignment with existing directory patterns.

### **Proposed Structure**

```
src/lib/spacetime-db/
├── index.ts (aggregates all calculator data)
├── cargo/
│   ├── cargo.ts (existing)
│   └── calculator.ts (new - cargo calculator DTOs)
├── resources/
│   ├── resources.ts (existing)
│   └── calculator.ts (new - resource calculator DTOs)
├── items/
│   └── calculator.ts (new - item calculator DTOs)
├── recipes/
│   ├── recipes.ts (existing)
│   └── calculator.ts (new - recipe calculator DTOs)
└── shared/
    └── calculator-utils.ts (shared utilities)
```

### **Implementation Phases**

#### **Phase 1: Extract Shared Utilities** ✅

- [x] Create `src/lib/spacetime-db/shared/calculator-utils.ts`
- [x] Move shared functions:
  - `cleanIconAssetPath()`
  - `shouldFilterItem()`
  - `getItemPrefix()`
  - `createUnifiedLookup()` (refactored with dependency injection)

#### **Phase 2: Create Module-specific Calculator Files** ✅

- [x] Create `src/lib/spacetime-db/items/calculator.ts`
  - Move `mapItemToCalculatorItem()`
  - Add `transformItemsToCalculator()` utility
- [x] Create `src/lib/spacetime-db/cargo/calculator.ts`
  - Move `mapCargoToCalculatorItem()`
  - Add `transformCargoToCalculator()` utility
- [x] Create `src/lib/spacetime-db/resources/calculator.ts`
  - Move `mapResourceToCalculatorItem()`
  - Add `transformResourcesToCalculator()` utility
- [x] Create `src/lib/spacetime-db/recipes/calculator.ts`
  - Move `mapCraftingRecipeToCalculatorRecipe()`
  - Move `mapExtractionRecipeToCalculatorRecipe()`
  - Add `transformCraftingRecipesToCalculator()` and `transformExtractionRecipesToCalculator()` utilities

#### **Phase 3: Update Index Aggregation** ✅

- [x] Update `src/lib/spacetime-db/index.ts` to import from modules
- [x] Refactor `getCalculatorGameData()` to call module-specific functions
- [x] Ensure backward compatibility for existing imports

#### **Phase 4: Add Enhanced Slugs**

- [ ] Add `item_slug` field to `CalculatorItem` interface
- [ ] Implement `{item_tier}-{item_rarity}-{item_name}` format
- [ ] Update existing slug generation to use new format
- [ ] Ensure uniqueness across all entity types

### **Benefits**

- ✅ Better modularity and separation of concerns
- ✅ Easier maintenance and testing
- ✅ Follows existing directory patterns
- ✅ Supports future individual item page development
- ✅ Enables parallel development on different modules

## 📋 **Remaining Tasks from Today's Session**

### **Medium Priority**

- [ ] **Optimize useEffect dependencies to reduce re-renders**
  - Review CustomNode component for unnecessary re-renders
  - Optimize dependency arrays in useEffect hooks
  - Consider using useMemo/useCallback where appropriate

- [ ] **Extract business logic from CustomNode component**
  - Move recipe selection logic to custom hooks
  - Extract node creation/update logic
  - Separate UI from business logic

- [ ] **Cache game data to prevent refetching on navigation**
  - Implement caching strategy for calculator data
  - Consider using React Query or similar solution
  - Prevent unnecessary API calls on route changes

## 🎯 **Future Enhancements**

### **Individual Item Pages**

- [ ] Create `/compendium/[tag]/[item_slug]/page.tsx` structure
- [ ] Implement rich item pages with:
  - Item details and stats
  - Recipe information
  - Cross-links to calculator
  - Related items

### **Cross-linking System**

- [ ] Implement seamless navigation between:
  - Calculator: `/calculator/[slug]`
  - Compendium: `/compendium/[tag]/[item_slug]`
- [ ] Ensure both use the same enhanced slug format
- [ ] Add breadcrumb navigation

### **Data Enrichment**

- [ ] Add more item metadata:
  - Usage statistics
  - Popularity rankings
  - Recipe complexity scores
  - Related items/alternatives

## 🔧 **Technical Debt**

### **Code Quality**

- [x] Remove duplicate console.log statements in `calculator-dtos.ts:379`
- [ ] Add comprehensive error handling for recipe parsing
- [ ] Implement proper TypeScript strict mode compliance
- [ ] Add unit tests for calculator transformation functions

### **Performance**

- [ ] Profile calculator data loading performance
- [ ] Optimize large dataset transformations
- [ ] Consider lazy loading for non-essential data

### **Fixes**

- [ ] Resource icons are not displaying in the calculator
- [ ] Update resource assets with unityassetripper

## 📝 **Documentation**

### **Architecture Documentation**

- [ ] Document the new module-based architecture
- [ ] Create developer guide for adding new modules
- [ ] Document calculator data flow and transformation pipeline

### **API Documentation**

- [ ] Document all exported functions from spacetime-db modules
- [ ] Add JSDoc comments for complex functions
- [ ] Create usage examples for calculator integration

---

## 🎯 **Next Session Priority**

1. **High**: Implement Phase 1 of module-based DTO architecture
2. **Medium**: Add enhanced slug generation
3. **Low**: Optimize remaining useEffect dependencies

## 💡 **Notes**

- All existing functionality is working correctly after today's refactor
- ID collision issue has been resolved with prefixed IDs
- Game data provider is properly structured at layout level
- Calculator now shows correct item names instead of fallback text
