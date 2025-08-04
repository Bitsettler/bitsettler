# 📚 Documentation Index
**BitCraft.Guide Settlement Management System**

Streamlined documentation for developers and contributors.

---

## 🚀 **Start Here**

### **New Developer Onboarding**
**[📖 DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)**
- **Purpose**: Complete setup and architecture guide for new team members
- **Covers**: Setup, architecture, authentication, development workflow, testing
- **Time**: 15-minute quick setup + comprehensive reference guide

### **Quick Project Overview**
**[📄 README.md](./README.md)**
- **Purpose**: Project summary and quick start instructions
- **Covers**: Features overview, tech stack, basic setup, contributing guidelines
- **Time**: 5-minute overview

---

## 📖 **Detailed Documentation**

### 🔐 **Authentication & Security**

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Authentication Architecture](./docs/AUTHENTICATION.md)** | Complete auth system design and security patterns | All developers |
| **[Authentication Developer Guide](./docs/AUTH_DEVELOPER_GUIDE.md)** | Code examples, implementation patterns, testing | Frontend/Backend devs |
| **[NextAuth → Supabase Migration](./docs/MIGRATION_NEXTAUTH_TO_SUPABASE.md)** | Historical migration record and lessons learned | Senior developers |

**Key Topics:**
- Supabase Auth with OAuth providers (Google, Discord, GitHub)
- Character claiming and user-settlement linking system
- Role-based permissions mirroring in-game hierarchy
- Row Level Security (RLS) and database protection patterns
- API authentication and session management

### 🏛️ **Settlement Management**

| Document | Purpose | Audience |
|----------|---------|----------|
| **[BitJita API Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** | External API integration, rate limiting, data sync | Backend developers |
| **[Current Project Status](./CHANGELOG.md)** | Feature development history and current status | All stakeholders |

**Key Topics:**
- BitJita.com API integration with local database caching
- Settlement data synchronization (5-30 minute intervals)
- Treasury polling and real-time balance tracking
- Rate limiting patterns and respectful API usage
- Database schema for settlements, members, projects, treasury

### 🛠️ **Development & Deployment**

| Document | Purpose | Audience |
|----------|---------|----------|
| **[Complete Developer Guide](./DEVELOPER_ONBOARDING.md)** | Architecture, setup, workflows, testing | New developers |
| **[Project README](./README.md)** | Quick overview and basic setup | All developers |
| **[Development TODO](./TODO.md)** | Current priorities and upcoming features | All contributors |

**Key Topics:**
- Data → Page → View architecture pattern
- Database migration procedures using Supabase CLI
- Authentication testing and user data management
- Code quality standards and development workflow

---

## 🎯 **Quick Reference by Use Case**

### **"I'm new to this project"**
1. **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** - Complete setup and architecture guide
2. **[README.md](./README.md)** - Project overview and features
3. **[docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)** - Understand the auth system

### **"I'm implementing authentication features"**
1. **[docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)** - System architecture and design
2. **[docs/AUTH_DEVELOPER_GUIDE.md](./docs/AUTH_DEVELOPER_GUIDE.md)** - Code examples and patterns
3. **[SETTLEMENT-MANAGEMENT_REFERENCE.md](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** - Data access patterns

### **"I'm working with settlement data"**
1. **[SETTLEMENT-MANAGEMENT_REFERENCE.md](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** - BitJita API integration
2. **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** - Architecture and data flow
3. **[docs/AUTH_DEVELOPER_GUIDE.md](./docs/AUTH_DEVELOPER_GUIDE.md)** - Permission checking patterns

### **"I need to debug an issue"**
1. **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md#-testing--debugging)** - Common issues and solutions
2. **[docs/AUTH_DEVELOPER_GUIDE.md](./docs/AUTH_DEVELOPER_GUIDE.md)** - Auth debugging tips
3. **[SETTLEMENT-MANAGEMENT_REFERENCE.md](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** - API debugging

---

## 🔍 **Code Quick Reference**

### **Authentication**
```typescript
// Get current user session
import { useSession } from '@/hooks/use-auth';
const { data: { user, session }, status } = useSession();

// Server-side authentication
import { requireAuth } from '@/lib/supabase-server-auth';
const { user } = await requireAuth(request);

// Permission checking
import { useSettlementPermissions } from '@/hooks/use-settlement-permissions';
const { canManageProjects, canViewTreasury } = useSettlementPermissions();
```

### **Database Operations**
```bash
# Create migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db push --db-url "DATABASE_URL" --yes

# Clear test data (preserves BitJita data)
curl -X POST http://localhost:3000/api/testing/clear-user-data
```

### **Development**
```bash
npm run dev          # Start development server
npm run format       # Format code with Prettier
npm run lint         # Check code quality
npm run build        # Build for production
```

---

## 📊 **Documentation Status**

| Category | Status | Last Updated | Coverage |
|----------|--------|--------------|----------|
| **Developer Onboarding** | ✅ Complete | January 2025 | 100% |
| **Authentication System** | ✅ Complete | January 2025 | 100% |
| **Settlement API Integration** | ✅ Complete | January 2025 | 95% |
| **Project Setup & Architecture** | ✅ Complete | January 2025 | 100% |
| **Migration Records** | ✅ Complete | January 2025 | 100% |
| **Testing & Debugging** | ✅ Complete | January 2025 | 90% |

---

## 📁 **File Organization**

```
Documentation Structure:
├── DEVELOPER_ONBOARDING.md          # 🌟 PRIMARY: Complete developer guide
├── README.md                        # Quick project overview and setup
├── DOCUMENTATION_INDEX.md           # This file - navigation guide
├── TODO.md                          # Current development priorities
├── CHANGELOG.md                     # Project history and feature status
├── SETTLEMENT-MANAGEMENT_REFERENCE.md # BitJita API integration details
├── docs/                            # Technical deep-dive documentation
│   ├── AUTHENTICATION.md            # Auth system architecture
│   ├── AUTH_DEVELOPER_GUIDE.md      # Auth implementation guide
│   └── MIGRATION_NEXTAUTH_TO_SUPABASE.md # Historical migration record
└── [Removed redundant files]        # Consolidated into primary docs
```

---

## 🤝 **Contributing to Documentation**

### **Documentation Standards**
- **Primary Guide**: [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) contains comprehensive information
- **Specialized Docs**: Technical deep-dives in `/docs` for specific systems
- **Cross-References**: Link related documentation appropriately
- **Code Examples**: Include practical, tested code examples
- **Update Index**: Add new docs to this index when created

### **Adding New Documentation**
1. **Determine if information belongs in existing docs** - avoid duplication
2. **Create specialized doc only if content is extensive and technical**
3. **Follow established format and style patterns**
4. **Add cross-references to related documents**
5. **Update this index with the new document**
6. **Update [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) if it's essential information**

---

## 🔗 **External Resources**

- **[Supabase Documentation](https://supabase.com/docs)** - Database and authentication platform
- **[Next.js Documentation](https://nextjs.org/docs)** - React framework
- **[BitJita.com](https://bitjita.com)** - External settlement data source
- **[shadcn/ui](https://ui.shadcn.com)** - UI component library
- **[Vercel Documentation](https://vercel.com/docs)** - Deployment platform

---

## 📞 **Getting Help**

### **For Development Questions**
1. **Check [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** for comprehensive guidance
2. **Search existing GitHub issues** for similar problems
3. **Review relevant technical documentation** in `/docs`
4. **Create new issue** with specific details and reproduction steps

### **For Production Issues**
1. **Check [CHANGELOG.md](./CHANGELOG.md)** for recent changes and known issues
2. **Review authentication troubleshooting** in [docs/AUTH_DEVELOPER_GUIDE.md](./docs/AUTH_DEVELOPER_GUIDE.md)
3. **Check BitJita API integration** in [SETTLEMENT-MANAGEMENT_REFERENCE.md](./SETTLEMENT-MANAGEMENT_REFERENCE.md)
4. **Contact development team** with logs and detailed steps to reproduce

---

**🌟 Start with [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) for comprehensive project guidance!**

**Last Updated:** January 2025 | **Project Status:** 🚀 Production Ready