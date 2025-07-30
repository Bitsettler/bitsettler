# 📚 Bitcraft Settlement Management Documentation

## Overview

This documentation covers the complete Bitcraft Settlement Management web application, built with Next.js, Supabase, and TypeScript.

## 🔐 Authentication System

### [Authentication Architecture](./AUTHENTICATION.md)
Complete documentation of the Supabase Auth system including:
- Authentication flow and character claiming
- Role-based permissions mirroring in-game hierarchy
- Database security with Row Level Security (RLS)
- OAuth providers (Google, Discord, GitHub)
- Environment configuration and troubleshooting

### [Developer Guide - Authentication](./AUTH_DEVELOPER_GUIDE.md)
Practical guide for developers working with auth:
- Adding authentication to new pages and API routes
- Permission-based components and guards
- Testing helpers and debugging tips
- Security checklist and best practices

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase managed)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

### Key Features
- **Settlement Management**: Projects, treasury, members
- **Role-Based Access**: Mirrors in-game settlement permissions
- **Character Claiming**: Links app users to in-game characters
- **Real-time Data**: Synced with BitJita API
- **Internationalization**: Multi-language support

## 📁 Project Structure

```
bitcraft.guide-web-next/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/          # Internationalized routes
│   │   ├── api/               # API routes
│   │   └── auth/              # Auth callback handlers
│   ├── components/            # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   ├── ui/                # Base UI components (shadcn/ui)
│   │   └── settlement/        # Settlement-specific components
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-auth.tsx       # Main authentication hook
│   │   └── use-settlement-permissions.ts
│   ├── lib/                   # Utility libraries
│   │   ├── supabase-auth.ts   # Client-side Supabase
│   │   └── supabase-server-auth.ts # Server-side Supabase
│   └── views/                 # Page view components
├── supabase/
│   ├── migrations/            # Database migrations
│   └── config.toml           # Supabase CLI configuration
├── docs/                      # Documentation
└── database/                  # Legacy migration files
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bitcraft.guide-web-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```

4. **Database Setup**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   npx supabase login
   
   # Apply migrations
   npx supabase db push --db-url "your-database-url"
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Development Workflow

### Database Changes
Always use Supabase CLI for schema changes:

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
2. **Permission Checks**: Implement role-based access control
3. **Database Security**: Ensure RLS policies protect data
4. **Testing**: Test with different user roles

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Fix linting errors, don't disable rules
- **Prettier**: Consistent code formatting
- **Components**: Use functional components with hooks

## 🧪 Testing

### Authentication Testing
```bash
# Start dev server
npm run dev

# Test authentication flow
1. Visit http://localhost:3000/en/auth/signin
2. Sign in with OAuth or email/password
3. Complete character claiming
4. Test role-based navigation
```

### API Testing
```bash
# Test protected endpoints
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/user/current-member
```

## 🚀 Deployment

### Production Environment

1. **Vercel Deployment**
   - Connect GitHub repository to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy automatically on push to main branch

2. **Environment Variables**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **OAuth Configuration**
   - Update redirect URLs in Supabase dashboard
   - Configure OAuth providers for production domain

## 📋 Features Documentation

### Completed Features
- ✅ **Authentication System**: Supabase Auth with OAuth
- ✅ **Character Claiming**: Link users to in-game characters
- ✅ **Role-Based Permissions**: Mirror in-game settlement hierarchy
- ✅ **Settlement Dashboard**: Overview of settlement data
- ✅ **Project Management**: Create and track settlement projects
- ✅ **Treasury System**: Financial transaction tracking
- ✅ **Member Management**: View settlement roster and skills

### In Development
- 🚧 **Real-time Updates**: Live data synchronization
- 🚧 **Mobile Optimization**: Responsive design improvements
- 🚧 **Advanced Analytics**: Settlement performance metrics

## 🔒 Security

### Authentication Security
- JWT tokens with automatic refresh
- OAuth integration with major providers
- Row Level Security (RLS) on all sensitive data
- Server-side session validation

### Data Protection
- User data isolated by settlement
- Permission-based access control
- Audit trails for important actions
- HTTPS enforcement in production

## 🐛 Troubleshooting

### Common Issues

**Authentication Errors**
- Check Supabase configuration
- Verify environment variables
- Confirm OAuth redirect URLs

**Permission Denied**
- Ensure user has claimed a character
- Check in-game settlement roles
- Verify RLS policies

**Database Connection Issues**
- Check Supabase project status
- Verify database URL and credentials
- Confirm migrations are applied

## 🤝 Contributing

### Before Contributing
1. Read the [Authentication Documentation](./AUTHENTICATION.md)
2. Understand the role-based permission system
3. Follow the established code patterns
4. Test authentication flows thoroughly

### Development Guidelines
- Never bypass authentication checks
- Always use Supabase CLI for database changes
- Implement proper error handling
- Add appropriate loading states
- Follow TypeScript best practices

## 📞 Support

For issues and questions:
1. Check the documentation first
2. Search existing GitHub issues
3. Create a new issue with detailed information
4. Include error messages and steps to reproduce

---

## Quick Links

- [Authentication System](./AUTHENTICATION.md)
- [Developer Guide](./AUTH_DEVELOPER_GUIDE.md)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Vercel Dashboard](https://vercel.com/dashboard)

## Project Status

**Current Version**: 2.0.0 (Post Supabase Auth Migration)  
**Last Updated**: January 2025  
**Status**: Active Development