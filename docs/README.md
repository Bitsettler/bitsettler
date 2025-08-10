# 📚 Bitsettler Settlement Management Documentation

## Overview

This documentation covers the complete Bitsettler Settlement Management web application, built with Next.js, Supabase, and TypeScript.

## 📖 **Documentation Index**

### 🔐 **Authentication & Security**
- **[Authentication Architecture](./AUTHENTICATION.md)** - Complete Supabase Auth system overview
- **[Developer Guide - Authentication](./AUTH_DEVELOPER_GUIDE.md)** - Practical implementation patterns
- **[Migration Guide](./MIGRATION_NEXTAUTH_TO_SUPABASE.md)** - NextAuth to Supabase migration record

### 🏛️ **Settlement System**
- **[BitJita API Integration](../SETTLEMENT-MANAGEMENT_REFERENCE.md)** - External API integration and data sync
- **[Database Schema](./DATABASE_SCHEMA.md)** - Complete database documentation *(Coming Soon)*
- **[API Reference](./API_REFERENCE.md)** - Internal API endpoints *(Coming Soon)*

### 🚀 **Development & Deployment**
- **[Getting Started](./GETTING_STARTED.md)** - Quick setup guide *(Coming Soon)*
- **[Production Deployment](./DEPLOYMENT.md)** - Production deployment guide *(Coming Soon)*
- **[Current Status](../CURRENT_STATUS.md)** - Production readiness summary

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase managed)
- **Authentication**: Supabase Auth with OAuth providers
- **External APIs**: BitJita.com for settlement data
- **Deployment**: Vercel (recommended)

### Key Features
- **🔐 Authentication**: OAuth (Google, Discord, GitHub) + Email/Password
- **👤 Character Claiming**: Link app users to in-game characters
- **🏛️ Settlement Management**: Projects, treasury, members with role-based access
- **📊 Real-time Data**: Synced with BitJita API every 5-30 minutes
- **🔒 Security**: Row Level Security (RLS) protecting all user data
- **🌍 Internationalization**: Multi-language support

## 🔄 Data Flow Architecture

```mermaid
graph TB
    A[User Login] --> B[Supabase Auth]
    B --> C[Character Claiming]
    C --> D[Settlement Access]
    
    E[BitJita API] --> F[Local Database Cache]
    F --> G[Settlement Data]
    G --> D
    
    D --> H[Role-Based Permissions]
    H --> I[Dashboard Features]
    
    J[Treasury Polling] --> K[Real-time Balance]
    K --> I
```

## 📁 Project Structure

```
bitsettler/
├── docs/                          # 📚 Complete documentation suite
│   ├── AUTHENTICATION.md          # Auth system architecture
│   ├── AUTH_DEVELOPER_GUIDE.md    # Auth implementation guide
│   ├── MIGRATION_NEXTAUTH_TO_SUPABASE.md # Migration record
│   └── README.md                  # This file
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/             # Internationalized routes
│   │   │   ├── auth/             # Auth pages (signin, claim-character)
│   │   │   ├── settlement/       # Settlement management pages
│   │   │   ├── profile/          # User profile management
│   │   │   └── settings/         # App preferences
│   │   └── api/                  # API routes
│   │       ├── auth/             # Auth endpoints
│   │       ├── user/             # User-specific data
│   │       └── settlement/       # Settlement data & operations
│   ├── components/               # Reusable UI components
│   │   ├── auth/                 # Authentication components
│   │   ├── ui/                   # Base UI components (shadcn/ui)
│   │   └── settlement/           # Settlement-specific components
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.tsx          # 🔐 Main authentication hook
│   │   ├── use-settlement-permissions.ts # Role-based permissions
│   │   └── use-current-member.ts # Current user's settlement data
│   ├── lib/                      # Utility libraries
│   │   ├── supabase-auth.ts      # Client-side Supabase
│   │   ├── supabase-server-auth.ts # Server-side Supabase
│   │   └── spacetime-db-new/     # Database utilities & BitJita integration
│   └── views/                    # Page view components
├── supabase/
│   ├── migrations/               # 🗄️ Database migrations
│   └── config.toml              # Supabase CLI configuration
├── SETTLEMENT-MANAGEMENT_REFERENCE.md # 🌐 BitJita API integration docs
├── CURRENT_STATUS.md            # 📊 Production readiness status
└── database/                    # Legacy migration files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Quick Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd bitsettler
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

3. **Database Setup**
   ```bash
   # Apply migrations using Supabase CLI
   npx supabase db push --db-url "your-database-url"
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

5. **Test Authentication**
   - Visit: http://localhost:3000/en/auth/signin
   - Sign in with OAuth or email/password
   - Complete character claiming process
   - Test role-based navigation

## 🎯 Core Systems

### 🔐 Authentication System
- **Provider**: Supabase Auth
- **Methods**: OAuth (Google, Discord, GitHub), Email/Password, Magic Links
- **Security**: JWT tokens, automatic refresh, Row Level Security
- **Character Linking**: Users claim in-game settlement characters
- **Documentation**: [Authentication Architecture](./AUTHENTICATION.md)

### 🏛️ Settlement Management
- **Data Source**: BitJita.com API with local caching
- **Sync Strategy**: Background polling every 5-30 minutes
- **Features**: Dashboard, projects, treasury, member management
- **Permissions**: Mirror exact in-game settlement hierarchy
- **Documentation**: [BitJita API Integration](../SETTLEMENT-MANAGEMENT_REFERENCE.md)

### 🛡️ Role-Based Permissions

| **Role** | **Dashboard** | **Projects** | **Treasury** | **Members** | **Admin** |
|----------|---------------|--------------|-------------- |-------------|-----------|
| **Member** | ✅ View | ✅ View | ✅ View | ✅ View | ❌ |
| **Storage** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Builder** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Officer** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |
| **Co-Owner** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |

## 🔧 Development Workflow

### Database Changes
⚠️ **Always use Supabase CLI for schema changes**:

```bash
# Create new migration
npx supabase migration new your_migration_name

# Apply migrations
npx supabase db push --db-url "postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-us-east-2.pooler.supabase.com:5432/postgres"

# Commit migration files
git add supabase/migrations/
git commit -m "Add: your migration description"
```

### Adding New Features

1. **Authentication Required**: All settlement features require authentication
2. **Permission Checks**: Implement role-based access control using `useSettlementPermissions`
3. **Database Security**: Ensure RLS policies protect data appropriately
4. **Testing**: Test with different user roles and permission levels

### Code Style & Standards

- **TypeScript**: Strict mode enabled, proper type definitions
- **ESLint**: Fix linting errors, don't disable rules
- **Authentication**: Never bypass auth checks, always validate sessions
- **Database**: Use Supabase CLI workflow, respect RLS policies
- **UI/UX**: Implement loading states, error handling, and role-based rendering

## 🧪 Testing

### Authentication Testing Flow
```bash
# 1. Start development server
npm run dev

# 2. Test authentication flow
# Visit: http://localhost:3000/en/auth/signin
# Sign in with OAuth provider or email/password
# Complete character claiming process
# Test role-based navigation and permissions

# 3. Test API endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/user/current-member
```

### Database Testing
```sql
-- Check RLS policies are working
SELECT * FROM settlement_members WHERE auth_user_id = 'test-user-id';

-- Verify permissions sync
SELECT name, inventory_permission, build_permission, officer_permission, co_owner_permission 
FROM settlement_members WHERE auth_user_id IS NOT NULL;
```

## 🚀 Production Deployment

### Environment Setup
```env
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### OAuth Configuration
- Update redirect URLs in Supabase Dashboard for production domain
- Configure OAuth providers for production environment
- Ensure HTTPS is properly configured

### Database Migrations
- Apply all migrations to production database
- Verify RLS policies are active
- Test authentication flows in production

## 📋 Features Status

### ✅ Completed Features
- **Authentication System**: Complete Supabase Auth with OAuth
- **Character Claiming**: Link users to in-game characters
- **Role-Based Permissions**: Perfect mirror of in-game hierarchy
- **Settlement Dashboard**: Overview of settlement data
- **Project Management**: Create and track settlement projects
- **Treasury System**: Financial transaction tracking with BitJita integration
- **Member Management**: View settlement roster and skills
- **Database Security**: Comprehensive RLS protecting all user data

### 🚧 In Development
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Settlement performance metrics
- **Mobile Optimization**: Enhanced mobile experience
- **API Documentation**: Comprehensive API reference

## 🔒 Security

### Authentication Security
- JWT tokens with automatic refresh
- OAuth integration with trusted providers
- Row Level Security (RLS) on all sensitive tables
- Server-side session validation on all API routes

### Data Protection
- User data isolated by settlement and user ID
- Permission-based access control throughout application
- Audit trails for important actions
- HTTPS enforcement in production

### Best Practices
- Never store sensitive data in client-side code
- Always validate user sessions on server-side
- Use RLS policies for database-level security
- Implement proper error handling that doesn't leak information

## 🐛 Troubleshooting

### Common Issues

**Authentication Errors**
- Check Supabase project configuration
- Verify environment variables are set correctly
- Confirm OAuth redirect URLs in Supabase Dashboard

**Permission Denied Errors**
- Ensure user has claimed a character
- Check user's in-game settlement role via BitJita API
- Verify RLS policies are configured correctly

**Database Connection Issues**
- Check Supabase project status
- Verify database URL and credentials
- Ensure migrations are applied

### Debug Resources
- [Authentication Developer Guide](./AUTH_DEVELOPER_GUIDE.md)
- [BitJita API Integration](../SETTLEMENT-MANAGEMENT_REFERENCE.md)
- [Current Status Report](../CURRENT_STATUS.md)

## 🤝 Contributing

### Before Contributing
1. Read the [Authentication Documentation](./AUTHENTICATION.md)
2. Understand the [BitJita API Integration](../SETTLEMENT-MANAGEMENT_REFERENCE.md)
3. Review the role-based permission system
4. Follow established code patterns and authentication flows

### Development Guidelines
- Never bypass authentication or permission checks
- Always use Supabase CLI for database changes
- Implement proper error handling and loading states
- Test with multiple user roles and permission levels
- Add appropriate documentation for new features

## 📞 Support

For issues and questions:
1. Check the relevant documentation first
2. Search existing GitHub issues
3. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and logs

---

## Quick Reference Links

### 🔐 Authentication
- [Authentication Architecture](./AUTHENTICATION.md)
- [Developer Guide](./AUTH_DEVELOPER_GUIDE.md)
- [Migration Guide](./MIGRATION_NEXTAUTH_TO_SUPABASE.md)

### 🏛️ Settlement System
- [BitJita API Integration](../SETTLEMENT-MANAGEMENT_REFERENCE.md)
- [Current Status](../CURRENT_STATUS.md)

### 🔧 External Resources
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [BitJita.com](https://bitjita.com) - External API source

---

**Project Status**: 🚀 **Production Ready**  
**Current Version**: 2.0.0 (Post Supabase Auth Migration)  
**Last Updated**: January 2025  
**Status**: Active Development