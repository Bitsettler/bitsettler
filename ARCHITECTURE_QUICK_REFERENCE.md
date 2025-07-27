# 🏗️ Data > Page > View Architecture Quick Reference

## 📋 **The Pattern**

### **Data Layer** (`src/lib/spacetime-db-new/`)
**Purpose**: Business logic and data operations  
**Pattern**: Commands (single operations) + Flows (complex workflows)

```typescript
// Command Example: Single data operation
export async function getAllMembers(options?: GetMembersOptions): Promise<CommandResult<SettlementMember[]>> {
  // Database query logic
  // Error handling
  // Return formatted result
}

// Flow Example: Complex multi-step operation  
export async function getSettlementDashboard(): Promise<FlowResult<DashboardData>> {
  // Combine multiple commands
  // Aggregate data
  // Return comprehensive result
}
```

### **Page Layer** (`src/app/[locale]/`)
**Purpose**: Routing and data orchestration  
**Pattern**: Minimal routing components that delegate to Views

```typescript
// Page Example: Route definition
export default async function SettlementMembersPage() {
  return <SettlementMembersView />;
}

// API Example: Expose data layer to frontend
export async function GET(request: NextRequest) {
  const result = await getAllMembers(options);
  return NextResponse.json(result);
}
```

### **View Layer** (`src/views/`)
**Purpose**: Pure presentation components  
**Pattern**: Client-side components with UI state management

```typescript
'use client';
export function SettlementMembersView() {
  // Client-side state (loading, filters, pagination)
  // Fetch data from API routes
  // Render UI components
  // Handle user interactions
}
```

---

## 🔄 **Data Flow**

```
User Action → View Component → API Route → Data Command → Database
                ↓                ↓            ↓            ↓
User Interface ← View Component ← API Route ← Data Result ← Database
```

---

## 📁 **File Naming Patterns**

### **Data Layer**
- `src/lib/spacetime-db-new/modules/{domain}/commands/{action}.ts`
- `src/lib/spacetime-db-new/modules/{domain}/flows/{workflow}.ts`

### **Page Layer**  
- `src/app/[locale]/{section}/page.tsx` (main pages)
- `src/app/[locale]/{section}/{subsection}/page.tsx` (sub-pages)
- `src/app/api/{section}/{endpoint}/route.ts` (API routes)

### **View Layer**
- `src/views/{section}-views/{component}-view.tsx`

---

## ⚡ **Quick Start Checklist**

### **Adding a New Feature**

1. **Data Layer First**
   - [ ] Create command in `modules/{domain}/commands/`
   - [ ] Add flow if complex workflow needed
   - [ ] Export from `modules/{domain}/index.ts`

2. **API Layer Second**  
   - [ ] Create API route in `app/api/{section}/`
   - [ ] Call data layer commands
   - [ ] Handle errors and return JSON

3. **Page Layer Third**
   - [ ] Create page in `app/[locale]/{section}/`
   - [ ] Import and render view component

4. **View Layer Last**
   - [ ] Create view in `views/{section}-views/`
   - [ ] Fetch data from API routes
   - [ ] Implement UI with loading/error states

### **Key Rules**
- ✅ **Data Layer**: No UI imports, only business logic
- ✅ **Page Layer**: Minimal, routing only
- ✅ **View Layer**: No direct database access, API calls only
- ✅ **API Layer**: Thin wrapper around data commands

---

## 🛠️ **Common Patterns**

### **Error Handling**
```typescript
// Data Layer
export type CommandResult<T> = {
  success: boolean;
  data: T;
  error?: string;
}

// API Layer  
if (!result.success) {
  return NextResponse.json(result, { status: 500 });
}

// View Layer
if (error) {
  return <ErrorComponent message={error} />;
}
```

### **Loading States**
```typescript
// View Layer
const [loading, setLoading] = useState(true);

if (loading) {
  return <LoadingSkeleton />;
}
```

### **Pagination**
```typescript
// Data Layer Command
export async function getAllMembers(options: {
  limit?: number;
  offset?: number;
}) { /* */ }

// API Layer
const params = new URLSearchParams(request.nextUrl.search);
const limit = parseInt(params.get('limit') || '20');

// View Layer  
const [currentPage, setCurrentPage] = useState(1);
const offset = (currentPage - 1) * itemsPerPage;
```

---

This architecture ensures **clean separation of concerns** and makes the codebase **maintainable and testable**! 