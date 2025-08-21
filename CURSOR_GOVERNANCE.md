# 🤖 Bitsettler - Cursor AI Governance

**Project Rules and Guidelines for AI Assistant**

## 🔒 **CRITICAL: Edit Permission System**

### **Default Behavior: ASK FIRST**
- **NEVER edit any files without explicit permission**
- **ALWAYS ask before opening files not directly requested**
- **Show diffs and get approval before making changes**

### **Restricted Areas (Read-Only Unless Explicitly Allowed)**
- Database schema and migrations (`supabase/migrations/`, `database/`)
- Authentication system (`src/hooks/use-auth.tsx`, auth-related files)
- Core settlement management (`src/views/settlement-views/`)
- API routes (`src/app/api/`) unless specifically working on them
- Production configuration files

### **Active Development Zones (When Working On Specific Features)**
- Calculator Engine v2: `src/lib/depv2/**`, `src/components/depv2/**`
- Development pages: `src/app/[locale]/dev/**`
- Documentation: `*.md` files (when doing doc work)
- Component updates: Only when explicitly working on UI

## 📚 **Documentation Hierarchy**

### **Primary Documentation (Always Current)**
1. **[README.md](./README.md)** - Project overview, quick start, development workflow
2. **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** - Complete developer guide
3. **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes

### **Technical Documentation**
- **[docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)** - Auth system architecture
- **[docs/AUTH_DEVELOPER_GUIDE.md](./docs/AUTH_DEVELOPER_GUIDE.md)** - Auth implementation patterns
- **[SETTLEMENT-MANAGEMENT_REFERENCE.md](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** - BitJita API integration

## 🏗️ **Architecture & Development Rules**

### **Mandatory Patterns**
1. **Architecture**: Always follow **Data → Page → View** pattern
2. **Authentication**: All settlement features require user authentication
3. **Database**: Use Supabase CLI for ALL schema changes - never direct edits
4. **Security**: Implement proper RLS policies and permission checks
5. **TypeScript**: Strict mode enabled - fix type errors, don't ignore them

### **Code Quality Standards**
- **ESLint**: Fix linting errors, don't disable rules
- **Performance**: Virtualize lists >200 rows, memoize heavy selectors
- **Caching**: Use LRU cache (size 500) for calculation results
- **Dark Theme**: Must match shadcn/ui defaults

### **Database Governance**
- **NEVER make direct database changes without explicit permission**
- **ALWAYS use Supabase CLI workflow**:
  ```bash
  npx supabase migration new migration_name
  npx supabase db push --db-url "your-database-url" --yes
  ```
- **NO database URL commits**: Keep sensitive URLs out of documentation

## 🎮 **BitCraft Domain Rules**

### **Game Data Handling**
- If no recipe produces an item → treat as **base material**
- Ignore placeholder names `{0}`/`{1}` → display `#<id>`
- Malformed data → skip gracefully, don't crash
- Steps = total recipe applications in expansion

### **Performance Targets**
- Build recipe/item indexes **once** per session
- Cold run < 300ms on deep trees
- Warm (cached) runs < 50ms

## 🧪 **Testing Requirements**

### **Required Test Coverage**
- Authentication flows with different user roles
- Edge cases: missing recipes, cycles, shared sub-inputs
- Calculator: output qty > 1, deep dependency trees
- API endpoints with proper auth validation

### **Testing Commands**
```bash
npm run lint           # Fix before committing
npm run build         # Must pass before deployment
# Use /api/testing/clear-user-data for clean test environments
```

## 📋 **Session Workflow**

### **Every Session Start**
1. **Read this governance file FIRST**
2. **Ask what specific areas I'm working on today**
3. **Only open files I explicitly mention**
4. **Show diffs before applying any changes**
5. **Follow edit permission zones based on current work**

### **Before Any Changes**
- [ ] Confirm I have permission for this edit zone
- [ ] Understand the specific task scope
- [ ] Check if changes affect auth, database, or core systems
- [ ] Ask if unsure about permissions

### **Commit Guidelines**
- **Make reasonable commits as work progresses**
- **DO NOT push to git without explicit permission**
- **Use conventional commit format**: `feat:`, `fix:`, `docs:`, etc.

## 🚨 **Critical Reminders**

### **NEVER Do These Things**
- Edit files outside current work scope without asking
- Make database schema changes without Supabase CLI
- Bypass authentication or permission checks
- Push to git repositories without permission
- Ignore TypeScript strict mode errors
- Disable ESLint rules instead of fixing issues

### **ALWAYS Do These Things**
- Ask before opening new files
- Show diffs and get approval
- Follow the Data → Page → View architecture
- Use proper authentication patterns
- Test with different user roles and permissions
- Consult documentation hierarchy when unsure

## 🔧 **Quick Reference**

### **Common Hooks & Patterns**
- **Auth**: `useSession()` from `@/hooks/use-auth`
- **Permissions**: `useSettlementPermissions()` for role-based access
- **Server Auth**: `requireAuth(request)` in API routes
- **Current Member**: `useClaimPlayer()` for settlement data

### **Key Directories**
- **Pages**: `src/app/[locale]/` (App Router)
- **Components**: `src/components/` (Reusable UI)
- **Views**: `src/views/` (Page-specific components)
- **API**: `src/app/api/` (Backend endpoints)
- **Hooks**: `src/hooks/` (React hooks)
- **Utils**: `src/lib/` (Utilities and integrations)

---

## 📞 **When In Doubt**

1. **Read the relevant documentation first**
2. **Ask for explicit permission**
3. **Explain what you plan to do before doing it**
4. **Show diffs and wait for approval**
5. **Better to ask too much than break something**

**Remember: This is a production application with real users. Safety first!**
