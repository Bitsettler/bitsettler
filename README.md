# 🎮 BitCraft.Guide
**Comprehensive crafting guide and settlement management system for BitCraft**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://vercel.com/)

> **🚀 Live at:** [bitcraft.guide](https://bitcraft.guide)  
> **💬 Community:** [Discord](https://discord.gg/DYzfsbVyNw)

---

## ✨ **What is BitCraft.Guide?**

### 🔍 **Crafting & Recipe System**
- **Interactive Recipe Visualization**: Flow diagrams showing crafting dependencies
- **Smart Calculator**: Calculate required materials for any output quantity
- **Comprehensive Item Database**: Search all items, cargo, and resources

### 🏛️ **Settlement Management**
- **Real-time Dashboard**: Settlement stats, projects, and treasury tracking
- **Character Claiming**: Link your account to in-game settlement characters
- **Member Management**: Skills tracking with live BitJita.com integration
- **Project & Treasury Tracking**: Collaborative settlement management

### 🔐 **Secure & Modern**
- **Supabase Authentication**: OAuth (Google, Discord, GitHub) + email/password
- **Role-Based Permissions**: Mirror exact in-game settlement hierarchy
- **Real-time Data**: Synced with BitJita API every 5-30 minutes
- **Multi-language Support**: Built-in internationalization

---

## 🚀 **Quick Start**

### **For Users**
1. **Visit**: [bitcraft.guide](https://bitcraft.guide)
2. **Sign Up**: Create account with OAuth or email
3. **Claim Character**: Link to your in-game settlement character
4. **Explore**: Use crafting calculator and settlement management features

### **For Developers**
```bash
# 1. Clone and install
git clone <repository-url>
cd bitcraft.guide-settlements
npm install

# 2. Configure environment (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://hnoiuyjdlecajbsjslwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 3. Setup database
npx supabase db push --db-url "postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres" --yes

# 4. Start development
npm run dev
# Open http://localhost:3000
```

**📚 New Developer?** → **[Read the Complete Onboarding Guide](./DEVELOPER_ONBOARDING.md)**

---

## 🏗️ **Tech Stack**

### **Core Technologies**
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **UI**: shadcn/ui + Radix UI + Tailwind CSS
- **Visualization**: React Flow + Dagre.js for recipe diagrams
- **External APIs**: BitJita.com for live settlement data

### **Architecture**: Data → Page → View
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   DATA LAYER    │    │   PAGE LAYER    │    │   VIEW LAYER    │
│ Business Logic  │ ←→ │ Next.js Routes  │ ←→ │ React Components│
│ Database/APIs   │    │ API Endpoints   │    │ User Interface  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 📊 **Features Overview**

| Feature | Status | Description |
|---------|--------|-------------|
| **🔍 Item Search** | ✅ Live | Search all BitCraft items, cargo, resources |
| **📊 Recipe Calculator** | ✅ Live | Interactive material requirement calculator |
| **🎨 Recipe Visualization** | ✅ Live | Flow diagrams for crafting dependencies |
| **🏛️ Settlement Dashboard** | ✅ Live | Real-time settlement statistics |
| **👥 Member Management** | ✅ Live | Skills tracking and profession preferences |
| **📋 Project Tracking** | ✅ Live | Settlement project management |
| **💰 Treasury Monitoring** | ✅ Live | Balance and transaction tracking |
| **🔐 Character Claiming** | ✅ Live | Link accounts to in-game characters |
| **🌐 Internationalization** | ✅ Live | Multi-language support |
| **📱 Responsive Design** | ✅ Live | Mobile-optimized interface |

---

## 🛠️ **Development**

### **Key Commands**
```bash
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### **Database Management**
```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations  
npx supabase db push --db-url "DATABASE_URL" --yes

# Reset development database
npx supabase db reset
```

### **Code Quality**
- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js rules + custom configuration
- **Prettier**: Automatic formatting with import organization
- **Supabase CLI**: Required for all database changes

---

## 📁 **Project Structure**

```
bitcraft.guide-settlements/
├── src/
│   ├── app/[locale]/              # Next.js App Router (Page Layer)
│   ├── views/                     # React components (View Layer)  
│   ├── lib/spacetime-db-new/      # Business logic (Data Layer)
│   ├── components/                # Reusable UI components
│   ├── hooks/                     # Custom React hooks
│   └── styles/                    # Global styles
├── supabase/migrations/           # Database migrations
├── docs/                          # Technical documentation
├── scripts/                       # Development utilities
└── DEVELOPER_ONBOARDING.md        # Complete developer guide
```

---

## 🎯 **Settlement Management Workflow**

### **User Onboarding**
1. **Authentication**: Sign in with OAuth or email/password
2. **Settlement Search**: Find and join existing settlement via BitJita API
3. **Character Claiming**: Link account to in-game settlement character  
4. **Dashboard Access**: View settlement stats, members, projects, treasury

### **Permission System**
| Role | Dashboard | Projects | Treasury | Members | Admin |
|------|-----------|----------|----------|---------|-------|
| **Member** | ✅ View | ✅ View | ✅ View | ✅ View | ❌ |
| **Storage** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Builder** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Officer** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |
| **Co-Owner** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |

---

## 🤝 **Contributing**

### **For New Developers**
1. **Read**: [Developer Onboarding Guide](./DEVELOPER_ONBOARDING.md)
2. **Setup**: Follow quick start instructions above
3. **Understand**: Data → Page → View architecture pattern
4. **Test**: Authentication flows and settlement features

### **Development Guidelines**
- **Authentication Required**: All settlement features require user authentication
- **Permission Checks**: Use role-based access control for feature access
- **Database Changes**: Always use Supabase CLI migrations
- **Code Quality**: Follow TypeScript strict mode and ESLint rules

### **Pull Request Process**
1. Fork repository and create feature branch
2. Follow architectural patterns and naming conventions
3. Test authentication flows and different permission levels
4. Run `npm run format` and `npm run lint`
5. Submit PR with clear description and testing notes

---

## 📚 **Documentation**

| Document | Purpose | Audience |
|----------|---------|----------|
| **[DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md)** | Complete developer setup and architecture guide | New developers |
| **[docs/AUTHENTICATION.md](./docs/AUTHENTICATION.md)** | Authentication system architecture | All developers |
| **[docs/AUTH_DEVELOPER_GUIDE.md](./docs/AUTH_DEVELOPER_GUIDE.md)** | Authentication implementation examples | Frontend/Backend |
| **[SETTLEMENT-MANAGEMENT_REFERENCE.md](./SETTLEMENT-MANAGEMENT_REFERENCE.md)** | BitJita API integration details | Backend developers |

---

## 🐛 **Testing & Debugging**

### **Test Data Management**
```bash
# Clear all user data for testing (preserves BitJita game data)
curl -X POST http://localhost:3000/api/testing/clear-user-data

# Or use shell script
./scripts/clear-user-data.sh
```

### **Common Issues**
- **Auth Problems**: Check `.env.local` Supabase keys
- **Database Issues**: Verify migrations applied with `npx supabase db push`
- **Settlement Data**: Check BitJita API rate limits and sync status
- **Build Errors**: Clear `.next` cache and reinstall dependencies

---

## 🔗 **Links & Resources**

- **🌐 Live Site**: [bitcraft.guide](https://bitcraft.guide)
- **💬 Discord**: [Community Chat](https://discord.gg/DYzfsbVyNw)
- **🗄️ Database**: [Supabase Dashboard](https://supabase.com/dashboard/project/hnoiuyjdlecajbsjslwh)
- **🚀 Deployment**: [Vercel Dashboard](https://vercel.com)
- **📊 Settlement Data**: [BitJita.com](https://bitjita.com)

---

## 🙏 **Acknowledgments**

Special thanks to:
- **[@wizjany](https://github.com/wizjany)** and **[BitCraft ToolBox](https://github.com/BitCraftToolBox)** for game database access
- **BitJita.com** for providing live settlement data API
- **BitCraft Community** for feedback and feature requests

---

## 📄 **License**

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

**Ready to contribute? Start with the [Developer Onboarding Guide](./DEVELOPER_ONBOARDING.md)! 🚀**