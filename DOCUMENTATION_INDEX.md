# 📚 Bitcraft Settlement Management - Complete Documentation Index

**Welcome to the comprehensive documentation for the Bitcraft Settlement Management application!**

This index provides quick access to all documentation across the project, organized by topic and use case.

---

## 🚀 **Quick Start Guides**

### For New Developers
1. **[Project Overview](./docs/README.md)** - Start here for system architecture and setup
2. **[Authentication System](./docs/AUTHENTICATION.md)** - Understand the Supabase Auth implementation
3. **[Developer Guide](./docs/AUTH_DEVELOPER_GUIDE.md)** - Practical code examples and patterns

### For System Administrators
1. **[Current Status](./CURRENT_STATUS.md)** - Production readiness and feature status
2. **[BitJita API Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** - External API integration details
3. **[Migration Guide](./docs/MIGRATION_NEXTAUTH_TO_SUPABASE.md)** - Historical changes and upgrades

---

## 📖 **Documentation by Category**

### 🔐 **Authentication & Security**

| Document | Purpose | Audience |
|----------|---------|----------|
| [Authentication Architecture](./docs/AUTHENTICATION.md) | Complete system overview, flows, and security | All developers |
| [Developer Implementation Guide](./docs/AUTH_DEVELOPER_GUIDE.md) | Code examples, patterns, and testing | Frontend/Backend devs |
| [Migration Guide](./docs/MIGRATION_NEXTAUTH_TO_SUPABASE.md) | NextAuth → Supabase migration record | DevOps/Senior devs |

**Key Topics Covered:**
- Supabase Auth implementation with OAuth providers
- Character claiming and user-settlement linking
- Role-based permissions mirroring in-game hierarchy
- Row Level Security (RLS) and database protection
- API security patterns and best practices

### 🏛️ **Settlement Management**

| Document | Purpose | Audience |
|----------|---------|----------|
| [BitJita API Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md) | External API integration and data sync | Backend devs/DevOps |
| [Database Schema](./docs/DATABASE_SCHEMA.md) | Complete database documentation | *Coming Soon* |
| [API Reference](./docs/API_REFERENCE.md) | Internal API endpoints reference | *Coming Soon* |

**Key Topics Covered:**
- BitJita.com API integration with local caching
- Settlement data synchronization (5-30 minute intervals)
- Treasury polling and real-time balance tracking
- Rate limiting and respectful API usage patterns
- Database schema for settlement, member, and treasury data

### 🛠️ **Development & Deployment**

| Document | Purpose | Audience |
|----------|---------|----------|
| [Project README](./docs/README.md) | Complete project overview and setup | All developers |
| [Current Status](./CURRENT_STATUS.md) | Production readiness and feature matrix | All stakeholders |
| [Getting Started Guide](./docs/GETTING_STARTED.md) | Step-by-step setup instructions | *Coming Soon* |
| [Deployment Guide](./docs/DEPLOYMENT.md) | Production deployment procedures | *Coming Soon* |

**Key Topics Covered:**
- Technology stack (Next.js, Supabase, TypeScript)
- Local development setup and configuration
- Database migration procedures using Supabase CLI
- Production deployment with Vercel
- Environment configuration and security

---

## 🎯 **Documentation by Use Case**

### "I'm new to this project"
1. [Project README](./docs/README.md) - Get the big picture
2. [Current Status](./CURRENT_STATUS.md) - See what's working
3. [Authentication Architecture](./docs/AUTHENTICATION.md) - Understand the auth system
4. [Developer Guide](./docs/AUTH_DEVELOPER_GUIDE.md) - Start coding

### "I need to implement authentication"
1. [Authentication Architecture](./docs/AUTHENTICATION.md) - Understand the system
2. [Developer Implementation Guide](./docs/AUTH_DEVELOPER_GUIDE.md) - Code examples
3. [BitJita Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md#authentication-requirements) - Data access patterns

### "I'm working with settlement data"
1. [BitJita API Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md) - External API details
2. [Authentication Requirements](./SETTLEMENT-MANAGEMENT_REFERENCE.md#authentication-requirements) - Access control
3. [Developer Guide](./docs/AUTH_DEVELOPER_GUIDE.md) - Permission checking patterns

### "I'm deploying to production"
1. [Current Status](./CURRENT_STATUS.md) - Verify readiness
2. [Authentication Architecture](./docs/AUTHENTICATION.md) - Security configuration
3. [BitJita Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md) - API configuration
4. [Migration Guide](./docs/MIGRATION_NEXTAUTH_TO_SUPABASE.md) - Understand recent changes

### "Something broke and I need to debug"
1. [Developer Implementation Guide](./docs/AUTH_DEVELOPER_GUIDE.md#debugging-tips) - Debug auth issues
2. [BitJita Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md#monitoring--debugging) - Debug API issues
3. [Current Status](./CURRENT_STATUS.md) - Check known issues

---

## 🔍 **Quick Reference**

### Authentication
- **Session Hook**: `import { useSession } from '@/hooks/use-auth'`
- **Permission Check**: `import { useSettlementPermissions } from '@/hooks/use-settlement-permissions'`
- **Server Auth**: `import { getSupabaseSession } from '@/lib/supabase-server-auth'`

### Database
- **Migrations**: `npx supabase migration new name` → `npx supabase db push --db-url "..."`
- **Client**: `import { supabase } from '@/lib/supabase-auth'`
- **Server**: `import { supabase } from '@/lib/spacetime-db-new/shared/supabase-client'`

### BitJita API
- **Rate Limits**: 200ms between calls, 5-minute treasury polling
- **Endpoints**: Search, roster, citizens, details
- **Monitoring**: Check `settlements_sync_log` and `treasury_history` tables

---

## 📊 **Documentation Status**

| Category | Status | Last Updated |
|----------|--------|--------------|
| **Authentication** | ✅ Complete | January 2025 |
| **Settlement API** | ✅ Complete | January 2025 |
| **Project Setup** | ✅ Complete | January 2025 |
| **Migration Records** | ✅ Complete | January 2025 |
| **Database Schema** | 🚧 Coming Soon | - |
| **API Reference** | 🚧 Coming Soon | - |
| **Deployment Guide** | 🚧 Coming Soon | - |

---

## 🤝 **Contributing to Documentation**

### Documentation Standards
- **Clear Purpose**: Each doc should have a specific audience and use case
- **Cross-References**: Link related documentation appropriately
- **Code Examples**: Include practical, tested code examples
- **Update Index**: Add new docs to this index

### File Organization
```
project-root/
├── DOCUMENTATION_INDEX.md     # This file - master index
├── CURRENT_STATUS.md          # Production status summary
├── SETTLEMENT-MANAGEMENT_REFERENCE.md # BitJita API integration
├── docs/                      # Authentication & development docs
│   ├── README.md             # Project overview and setup
│   ├── AUTHENTICATION.md     # Auth system architecture
│   ├── AUTH_DEVELOPER_GUIDE.md # Auth implementation guide
│   └── MIGRATION_NEXTAUTH_TO_SUPABASE.md # Migration record
└── [future docs]             # Database schema, API reference, etc.
```

### Adding New Documentation
1. Create the document in the appropriate location
2. Follow the established format and style
3. Add cross-references to related documents
4. Update this index with the new document
5. Update the project README if it's a major addition

---

## 🔗 **External Resources**

- **[Supabase Documentation](https://supabase.com/docs)** - Database and auth platform
- **[Next.js Documentation](https://nextjs.org/docs)** - Frontend framework
- **[BitJita.com](https://bitjita.com)** - External settlement data source
- **[Vercel Documentation](https://vercel.com/docs)** - Deployment platform

---

## 📞 **Getting Help**

### For Development Questions
1. Check the relevant documentation first
2. Look in the [Developer Implementation Guide](./docs/AUTH_DEVELOPER_GUIDE.md) for code examples
3. Search project GitHub issues
4. Create a new issue with specific details

### For Production Issues
1. Check [Current Status](./CURRENT_STATUS.md) for known issues
2. Review [Authentication Architecture](./docs/AUTHENTICATION.md) for auth problems
3. Check [BitJita Integration](./SETTLEMENT-MANAGEMENT_REFERENCE.md) for API issues
4. Contact the development team with logs and steps to reproduce

---

**This documentation index is maintained as the single source of truth for all project documentation. Keep it updated when adding or changing documentation!**

**Last Updated:** January 2025  
**Project Status:** 🚀 Production Ready  
**Documentation Coverage:** 90% Complete