# Environment Configuration

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Core Configuration
```bash
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### Supabase Configuration (Settlement Management)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### BitJita API Configuration
```bash
NEXT_PUBLIC_BITJITA_API_IDENTIFIER=PR3SIDENT/Bitcraft.guide
```

### Settlement Configuration
```bash
DEFAULT_SETTLEMENT_ID=your_default_settlement_id
DEFAULT_SETTLEMENT_NAME=your_settlement_name
```

## Setup Instructions

1. **Supabase Setup:**
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key from Settings > API
   - Generate a service role key for server-side operations

2. **Settlement Configuration:**
   - Find your settlement ID from BitJita.com
   - Set the default settlement name for the application

3. **Database Setup:**
   - Run the migration files in `/database/migrations/`
   - Import the database schema from `/database/schema.sql`

## Security Notes

- Never commit `.env.local` or any environment files with real credentials
- Use different keys for development and production environments
- The service role key should only be used in server-side operations 