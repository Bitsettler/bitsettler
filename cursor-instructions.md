# 🤖 Cursor AI Assistant Instructions

For complete project context and development guidelines, please refer to:

**📖 [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** - Complete developer guide
**📄 [README.md](./README.md)** - Project overview and quick start

## 📚 Essential Documentation Structure

- **README.md** - Project overview, setup, development workflow
- **DEVELOPER_ONBOARDING.md** - Complete development guide and architecture
- **docs/AUTHENTICATION.md** - Auth system architecture and security
- **docs/AUTH_DEVELOPER_GUIDE.md** - Auth implementation patterns
- **SETTLEMENT-MANAGEMENT_REFERENCE.md** - BitJita API integration
- **CHANGELOG.md** - Version history and changes

## Key Development Rules

1. **Architecture**: Always follow Data → Page → View pattern
2. **Authentication**: All settlement features require user authentication
3. **Database**: Use Supabase CLI for all schema changes
4. **Code Quality**: TypeScript strict mode + ESLint rules
5. **Testing**: Use `/api/testing/clear-user-data` for clean test environments

## Quick Reference

- **Auth Hook**: `useSession()` from `@/hooks/use-auth`
- **Permissions**: `useSettlementPermissions()` for role-based access
- **Server Auth**: `requireAuth(request)` in API routes
- **Database URL**: `postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres`

**For all development questions, consult the onboarding guide first!**