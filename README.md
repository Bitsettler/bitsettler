# Bitcraft.Guide

A comprehensive crafting guide and **settlement management system** for BitCraft, built with Next.js, Supabase, and TypeScript.

Got questions or feedback? Come say hi!
[Discord](https://discord.gg/DYzfsbVyNw)

## Features

### 🔍 **Crafting & Recipe System**
- **Item Search**: Search through all items, cargo, and resources in the game
- **Recipe Visualization**: Interactive flow diagrams showing crafting dependencies
- **Quantity Calculator**: Calculate required materials for any desired output quantity

### 🏛️ **Settlement Management** ⭐ *New!*
- **Settlement Dashboard**: Real-time overview of settlement stats, projects, and treasury
- **Character Claiming**: Link your account to in-game settlement characters
- **Project Management**: Track settlement projects and contributions
- **Member Management**: View settlement roster with skills and permissions
- **Treasury Tracking**: Monitor settlement finances with BitJita API integration
- **Role-Based Access**: Mirror exact in-game settlement hierarchy (Member, Storage, Builder, Officer, Co-Owner)

### 🔐 **Authentication & Security**
- **Supabase Authentication**: Secure OAuth (Google, Discord, GitHub) + Email/Password
- **Row-Level Security (RLS)**: Database-level protection for all user data
- **Session Management**: Automatic JWT token refresh and validation

### 🌐 **Core Features**
- **Internationalization**: Multi-language support with next-intl
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Real-time Data**: Synced with BitJita.com API every 5-30 minutes

## Tech Stack

### **Frontend & Backend**
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Flow Diagrams**: React Flow (@xyflow/react)
- **Layout Engine**: Dagre.js

### **Database & Authentication** 
- **Database**: PostgreSQL (Supabase managed)
- **Authentication**: Supabase Auth with OAuth providers
- **Security**: Row Level Security (RLS) policies
- **External APIs**: BitJita.com for settlement data

### **Development Tools**
- **Internationalization**: next-intl
- **Code Quality**: ESLint, Prettier with organize-imports plugin
- **Database Management**: Supabase CLI for migrations

## Getting Started

### Prerequisites

- **Node.js 18+** and npm
- **Supabase account** for database and authentication
- **Git** for version control

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd bitcraft.guide-web-next
```

2. **Install dependencies:**

```bash
npm install
```

3. **Environment Configuration:**

Create `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hnoiuyjdlecajbsjslwh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. **Database Setup (Supabase CLI):**

Apply database migrations using Supabase CLI:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Apply all migrations to your database
npx supabase db push --db-url "postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres" --yes
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Test the application:**

- Open [http://localhost:3000](http://localhost:3000) in your browser
- Visit [http://localhost:3000/en/auth/signin](http://localhost:3000/en/auth/signin) to test authentication
- Complete the settlement onboarding to test full functionality

## Available Scripts

### **Development**
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without changes

### **Database Management**
- `npx supabase migration new <name>` - Create new database migration
- `npx supabase db push --db-url "<database-url>" --yes` - Apply migrations to database
- `npx supabase db reset` - Reset local database (development only)

### **Data Processing**
- `npm run generate-samples` - Generate sample data
- `npm run map-items` - Map game items from server data
- `npm run map-items:sample` - Map items with sample data

## Project Structure

```
bitcraft.guide-web-next/
├── docs/                          # 📚 Complete documentation suite
│   ├── AUTHENTICATION.md          # Auth system architecture
│   ├── AUTH_DEVELOPER_GUIDE.md    # Auth implementation guide
│   └── README.md                  # Comprehensive project docs
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── [locale]/             # Internationalized routes
│   │   │   ├── auth/             # 🔐 Authentication pages
│   │   │   ├── settlement/       # 🏛️ Settlement management
│   │   │   ├── profile/          # 👤 User profile management
│   │   │   └── settings/         # ⚙️ App preferences
│   │   └── api/                  # API routes
│   │       ├── auth/             # Auth endpoints
│   │       ├── user/             # User-specific data
│   │       └── settlement/       # Settlement operations
│   ├── components/               # React components
│   │   ├── ui/                   # shadcn/ui base components
│   │   └── settlement/           # Settlement-specific components
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.tsx          # 🔐 Main authentication hook
│   │   ├── use-current-member.ts # Current user's settlement data
│   │   └── use-settlement-permissions.ts # Role-based permissions
│   ├── lib/                      # Utility libraries
│   │   ├── supabase-auth.ts      # Client-side Supabase
│   │   ├── supabase-server-auth.ts # Server-side Supabase
│   │   ├── api-client.ts         # Authenticated API client
│   │   └── spacetime-db-new/     # Database utilities & BitJita integration
│   ├── views/                    # Page view components
│   │   └── settlement-views/     # Settlement management views
│   ├── data/                     # Game data (items, recipes, etc.)
│   ├── scripts/                  # Data processing scripts
│   └── styles/                   # Global styles
├── supabase/
│   ├── migrations/               # 🗄️ Database migrations
│   └── config.toml              # Supabase CLI configuration
└── database/                    # Legacy migration files (deprecated)
```

## Data Sources

### **Static Game Data**
The project uses game data from BitCraft's server files, including:
- Items, cargo, and resources
- Crafting recipes and requirements  
- Building and tool information

### **Live Settlement Data** 🆕
Settlement management features use real-time data from:
- **[BitJita.com API](https://bitjita.com)**: Settlement roster, permissions, treasury data
- **Supabase Database**: Cached settlement data, user preferences, project tracking
- **Authentication**: Supabase Auth for secure user sessions

### **Data Flow**
1. **Initial Setup**: BitJita API data is fetched and stored locally during settlement establishment
2. **Real-time Sync**: Background polling keeps settlement data fresh (5-30 min intervals)
3. **User Actions**: Project contributions, preference changes stored in Supabase
4. **Security**: Row Level Security (RLS) ensures users only access their settlement data

## Acknowledgments

Special thanks to [@wizjany](https://github.com/wizjany) and the [BitCraft ToolBox](https://github.com/BitCraftToolBox) organization for providing access to the in-game database repositories that make this project possible.

## Development

### **Code Style & Standards**

- **Prettier**: Code formatting with organize-imports plugin
- **ESLint**: Code linting (fix errors, don't disable rules)
- **TypeScript**: Strict mode enabled with proper type definitions

### **Database Development Workflow** ⚠️ **Important**

**Always use Supabase CLI for schema changes** [[memory:4758277]]:

```bash
# 1. Create new migration
npx supabase migration new your_migration_name

# 2. Apply migrations (use actual database URL)
npx supabase db push --db-url "postgresql://postgres.hnoiuyjdlecajbsjslwh:8lhYYvTo5WAQsvsd@aws-0-us-east-2.pooler.supabase.com:5432/postgres" --yes

# 3. Commit migration files
git add supabase/migrations/
git commit -m "Add: your migration description"
```

### **Authentication Development**

- **Never bypass auth checks**: All settlement features require authentication
- **Use existing hooks**: `useAuth()`, `useCurrentMember()`, `useSession()`
- **Server-side validation**: Always validate sessions on API routes using `requireAuth()`
- **RLS policies**: Ensure Row Level Security protects data appropriately

### **Adding New Settlement Features**

1. **Authentication Required**: All features must check user authentication
2. **Permission Checks**: Use `useSettlementPermissions()` for role-based access
3. **Data Flow**: BitJita API → Database Storage → UI Display
4. **Testing**: Test with different user roles and permission levels
5. **Component Patterns**: Follow existing settlement component structure

### **API Development**

- **Authentication**: Use `requireAuth(request)` in all API routes
- **Error Handling**: Provide clear error messages without leaking sensitive data
- **Data Validation**: Validate all inputs and sanitize outputs
- **Response Format**: Use consistent API response structure

## **Settlement Onboarding Flow** 🏛️

New users go through a complete onboarding process:

1. **Authentication**: Sign in with OAuth (Google, Discord, GitHub) or email/password
2. **Settlement Choice**: Join existing settlement (invite code) or establish new one
3. **Settlement Search**: Search BitJita API for available settlements
4. **Data Import**: Fetch and store settlement members, permissions, and stats
5. **Character Claiming**: Link account to in-game settlement character
6. **Dashboard Access**: Full settlement management features unlocked

### **Role-Based Permissions**

| **Role** | **Dashboard** | **Projects** | **Treasury** | **Members** | **Admin** |
|----------|---------------|--------------|-------------- |-------------|-----------|
| **Member** | ✅ View | ✅ View | ✅ View | ✅ View | ❌ |
| **Storage** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Builder** | ✅ View | ✅ Manage | ✅ View | ✅ View | ❌ |
| **Officer** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |
| **Co-Owner** | ✅ View | ✅ Manage | ✅ Manage | ✅ Manage | ✅ Manage |

## Contributing

### **Before Contributing**
1. Read the [comprehensive documentation](./docs/README.md)
2. Understand the authentication and settlement system
3. Test with different user roles and permission levels

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Follow authentication and database development guidelines
4. Make your changes with proper error handling and loading states
5. Run `npm run format` and `npm run lint`
6. Test authentication flows and role-based permissions
7. Submit a pull request with clear description

### **Testing Guidelines**
- **Authentication**: Test login/logout with different OAuth providers
- **Settlement Features**: Test with different in-game roles (Member, Officer, Co-Owner)
- **Database Changes**: Always test migrations on development database first
- **API Endpoints**: Test with proper authentication headers and error cases

## License

This project is licensed under the MIT License.
