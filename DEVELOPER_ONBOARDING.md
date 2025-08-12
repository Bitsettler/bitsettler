# 🚀 Developer Onboarding Guide
**Bitsettler Settlement Management System**

Welcome to the team! This guide will get you up and running with our comprehensive crafting guide and settlement management system for BitCraft.

---

## 📋 **What You're Working On**

### **Project Overview**
Bitsettler is a Next.js application that provides:
- 🔍 **Crafting System**: Interactive recipe visualization and material calculator
- 🏛️ **Settlement Management**: Real-time settlement dashboard with member/project/treasury tracking
- 🔐 **Authentication**: Secure user accounts with character claiming
- 🌐 **Multi-language Support**: Internationalized interface

### **Key Technologies**
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **External APIs**: BitJita.com for live settlement data
- **Architecture**: Data → Page → View layer separation

---

## ⚡ **Quick Setup (15 minutes)**

### **1. Clone & Install**
```bash
git clone <repository-url>
cd bitsettler
npm install
```

### **2. Environment Setup**
Create `.env.local` in project root:
```env
# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=https://hnoiuyjdlecajbsjslwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true

# BitJita API
NEXT_PUBLIC_BITJITA_API_IDENTIFIER=PR3SIDENT/Bitsettler
```

**🔑 Get Supabase Keys:**
- Project ID: `hnoiuyjdlecajbsjslwh`
- Database Password: `8lhYYvTo5WAQsvsd`
- URL: `https://hnoiuyjdlecajbsjslwh.supabase.co`

### **3. Database Setup**
```bash
# Apply all migrations
npx supabase db push --db-url "postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres" --yes
```

### **4. Start Development**
```bash
npm run dev
# Opens http://localhost:3000
```

### **5. Test The System**
1. Visit [http://localhost:3000/en/auth/signin](http://localhost:3000/en/auth/signin)
2. Create account → Claim character → Set professions
3. Explore settlement dashboard and features

---

## 🏗️ **Architecture: Data → Page → View**

### **Critical Pattern: All features follow this 3-layer architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DATA LAYER    │    │   PAGE LAYER    │    │   VIEW LAYER    │
│                 │    │                 │    │                 │
│ Business Logic  │ ←→ │ Routing & APIs  │ ←→ │ UI Components   │
│ Database Calls  │    │ Data Fetching   │    │ User Interactions│
│ External APIs   │    │ Server Actions  │    │ State Management│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **1. Data Layer** (`src/lib/spacetime-db-new/`)
**Purpose**: All business logic and data operations

```typescript
// Commands: Single-purpose functions
export async function getAllMembers(): Promise<CommandResult<Member[]>> {
  // Database query logic
  // Error handling
  // Return formatted result
}

// Flows: Complex multi-step operations  
export async function getSettlementDashboard(): Promise<FlowResult<Dashboard>> {
  // Combine multiple commands
  // Aggregate data
  // Return comprehensive result
}
```

**Structure:**
```
lib/spacetime-db-new/
├── modules/
│   ├── settlements/commands/    # Single operations
│   ├── settlements/flows/       # Complex workflows
│   ├── members/
│   ├── projects/
│   └── treasury/
└── shared/
    ├── utils/                   # Shared utilities
    └── types/                   # Type definitions
```

### **2. Page Layer** (`src/app/[locale]/`)
**Purpose**: Routing and data orchestration

```typescript
// Page: Minimal routing
export default async function SettlementPage() {
  return <SettlementDashboardView />;
}

// API Route: Expose data to frontend
export async function GET(request: NextRequest) {
  const result = await getSettlementDashboard();
  return NextResponse.json(result);
}
```

### **3. View Layer** (`src/views/`)
**Purpose**: Pure presentation components

```typescript
'use client';
export function SettlementDashboardView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Fetch data from API routes
  // Handle loading/error states
  // Render UI components
  // Manage user interactions
}
```

---

## 🔐 **Authentication System**

### **How It Works**
1. **Supabase Auth**: OAuth (Google, Discord, GitHub) + Email/Password
2. **Character Claiming**: Link user account to in-game settlement character
3. **Role-Based Permissions**: Mirror exact in-game hierarchy

### **Key Hooks & Utils**
```typescript
// Get current user session
import { useSession } from '@/hooks/use-auth';
const { data: { user, session }, status } = useSession();

// Get current member data  
import { useCurrentMember } from '@/hooks/use-current-member';
const { member, loading, error } = useCurrentMember();

// Check permissions
import { useSettlementPermissions } from '@/hooks/use-settlement-permissions';
const { canManageProjects, canViewTreasury } = useSettlementPermissions();

// Server-side auth
import { requireAuth } from '@/lib/supabase-server-auth';
const { user } = await requireAuth(request);
```

### **Permission Levels**
| Role | Dashboard | Projects | Treasury | Members | Admin |
|------|-----------|----------|----------|---------|-------|
| **Member** | ✅ View | ✅ View | ✅ View | ✅ View | ❌ |
| **Storage** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Builder** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Officer** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |
| **Co-Owner** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |

---

## 🏛️ **Settlement Management Features**

### **Data Flow**
```
BitJita API → Database Storage → UI Display
     ↓              ↓              ↓
Settlement → Cached locally → Real-time updates
Treasury   → Background sync → Live dashboard
Members    → Character claims → Permission checks
```

### **Key Features**
- **Dashboard**: Real-time settlement stats and project overview
- **Member Management**: Skills tracking, profession preferences, permissions
- **Project Tracking**: Settlement-wide project management and contributions
- **Treasury**: Balance monitoring and transaction history
- **Character Claiming**: Link game characters to user accounts

### **External API Integration**
- **BitJita.com API**: Live settlement data source
- **Rate Limiting**: 200ms between calls, respectful usage
- **Background Sync**: 5-30 minute intervals for fresh data
- **Caching**: Local database storage for performance

---

## 📁 **Project Structure**

```
bitsettler/
├── src/
│   ├── app/[locale]/              # 🔄 Page Layer - Next.js routes
│   │   ├── auth/                  # Authentication pages
│   │   ├── settlement/            # Settlement management pages
│   │   ├── profile/               # User profile pages
│   │   └── api/                   # API routes
│   ├── views/                     # 🎨 View Layer - UI components
│   │   ├── settlement-views/      # Settlement feature UIs
│   │   ├── auth-views/            # Authentication UIs
│   │   └── calculator-views/      # Crafting calculator UIs
│   ├── lib/spacetime-db-new/      # 🔧 Data Layer - Business logic
│   │   ├── modules/               # Feature modules
│   │   │   ├── settlements/       # Settlement operations
│   │   │   ├── members/           # Member management
│   │   │   ├── projects/          # Project tracking
│   │   │   └── treasury/          # Treasury operations
│   │   └── shared/                # Shared utilities
│   ├── components/                # 🧩 Reusable UI components
│   │   ├── ui/                    # shadcn/ui base components
│   │   ├── settlement/            # Settlement-specific components
│   │   └── auth/                  # Authentication components
│   ├── hooks/                     # 🪝 Custom React hooks
│   ├── lib/                       # 📚 Utilities & configurations
│   └── styles/                    # 🎨 Global styles
├── supabase/migrations/           # 🗄️ Database migrations
├── scripts/                       # 🔧 Development utilities
└── docs/                          # 📚 Technical documentation
```

---

## 🛠️ **Development Workflow**

### **Adding New Features**

1. **Data Layer First** (`src/lib/spacetime-db-new/`)
   ```bash
   # Create command for single operations
   touch src/lib/spacetime-db-new/modules/{domain}/commands/{action}.ts
   
   # Create flow for complex workflows  
   touch src/lib/spacetime-db-new/modules/{domain}/flows/{workflow}.ts
   ```

2. **API Layer Second** (`src/app/api/`)
   ```bash
   # Create API route
   touch src/app/api/{section}/{endpoint}/route.ts
   ```

3. **View Layer Third** (`src/views/`)
   ```bash  
   # Create UI component
   touch src/views/{section}-views/{component}-view.tsx
   ```

4. **Page Layer Last** (`src/app/[locale]/`)
   ```bash
   # Create page route
   touch src/app/[locale]/{section}/page.tsx
   ```

### **Database Changes** ⚠️ **IMPORTANT**
**Always use Supabase CLI - never runtime schema changes!**

```bash
# 1. Create migration
npx supabase migration new your_migration_name

# 2. Write SQL in: supabase/migrations/[timestamp]_your_migration_name.sql

# 3. Apply migration
npx supabase db push --db-url "postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres" --yes

# 4. Commit migration files
git add supabase/migrations/
git commit -m "Add: your migration description"
```

### **Code Quality Standards**
```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

**Rules:**
- ✅ **Fix ESLint errors** - don't disable rules
- ✅ **TypeScript strict mode** - proper type definitions
- ✅ **Prettier formatting** - consistent code style
- ✅ **Component naming** - PascalCase for components, kebab-case for files

---

## 🧪 **Testing & Debugging**

### **Test User Data Clearing**
For testing settlement features with clean data:

```bash
# Clear all user assignments while preserving BitJita data
curl -X POST http://localhost:3000/api/testing/clear-user-data

# Or use the shell script
./scripts/clear-user-data.sh
```

This clears:
- ✅ All user auth accounts
- ✅ All character claims  
- ✅ All profession choices
- ✅ All user profiles/settings

Preserves:
- ✅ All 164+ settlement members with skills
- ✅ All BitJita game data
- ✅ All permissions and sync data

### **Authentication Testing**
1. **Sign up/Sign in**: Test OAuth (Google, Discord, GitHub) + email/password
2. **Character claiming**: Link account to settlement character
3. **Permission levels**: Test with different in-game roles
4. **Data isolation**: Verify users only see their settlement data

### **Settlement Testing**
1. **Dashboard**: Verify stats, member counts, project overview
2. **Member management**: Check skills display, profession selection
3. **Project tracking**: Test project creation, contributions
4. **Treasury**: Monitor balance updates, transaction history

---

## 🚨 **Common Issues & Solutions**

### **Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev

# Clear npm cache
npm install --force
```

### **Database Connection Issues**
```bash
# Test database connection
npx supabase db reset --db-url "postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Reapply migrations
npx supabase db push --db-url "..." --yes
```

### **Authentication Issues**
- Check `.env.local` for correct Supabase keys
- Verify user is signed in: `useSession()` hook
- Test character claiming flow on `/en/auth/claim-character`
- Check browser developer console for specific error messages

### **Settlement Data Issues**
- BitJita API rate limits: 200ms between calls
- Check database for recent sync: `settlements_sync_log` table
- Verify settlement ID matches BitJita.com data
- Test with different permission levels

---

## 🎯 **Current Priorities** 

Based on `TODO.md`, focus areas are:

### **High Priority**
- [ ] **Profession Images**: Add 18 profession avatars to `public/assets/ProfessionAvatars/`
- [ ] **Settlement Features**: Member search/filtering, activity tracking
- [ ] **Calculator Enhancements**: Recipe removal, depth slider, export features

### **Enhancement Opportunities**
- [ ] **Real-time Updates**: WebSocket integration for live data
- [ ] **User Experience**: Enhanced profile customization
- [ ] **Content Management**: MDX + rehype for content workflow

---

## 📚 **Additional Resources**

### **Technical Documentation**
- **[Authentication System](./docs/AUTHENTICATION.md)** - Complete auth architecture
- **[Developer Guide](./docs/AUTH_DEVELOPER_GUIDE.md)** - Code examples and patterns
- **[BitJita Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** - External API details

### **External APIs & Tools**
- **[Supabase Docs](https://supabase.com/docs)** - Database and auth platform
- **[Next.js Docs](https://nextjs.org/docs)** - Framework documentation
- **[BitJita.com](https://bitjita.com)** - Settlement data source
- **[shadcn/ui](https://ui.shadcn.com)** - UI component library

### **Development Tools**
- **[Supabase Dashboard](https://supabase.com/dashboard/project/hnoiuyjdlecajbsjslwh)** - Database management
- **[Vercel Dashboard](https://vercel.com)** - Deployment and analytics
- **[GitHub Repository](https://github.com/Bitsettler/bitsettler)** - Source code

---

## 🤝 **Getting Help**

### **Development Questions**
1. Check this onboarding guide first
2. Search existing GitHub issues
3. Check the technical documentation in `/docs`
4. Create detailed GitHub issue with reproduction steps

### **Production Issues**
1. Check [Vercel Dashboard](https://vercel.com) for deployment status
2. Check [Supabase Dashboard](https://supabase.com/dashboard) for database health
3. Monitor BitJita API status and rate limits
4. Contact team lead with logs and steps to reproduce

---

**Welcome to the team! You're now ready to build amazing features for the BitCraft community. 🚀**

**Questions? Don't hesitate to ask - we're here to help you succeed!**