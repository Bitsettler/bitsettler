# Database Setup for Settlement Management

This directory contains the database schema and migration files for integrating settlement management features.

## Structure

```
database/
├── README.md              # This file
├── schema.sql             # Complete database schema
├── migrations/            # Supabase migration files
│   ├── 001_initial_schema.sql
│   ├── 002_normalized_schema.sql
│   └── ...
└── seed-data.sql          # Initial data setup
```

## Key Tables

### Core Settlement Tables
- `settlement_members` - Member directory and basic info
- `member_professions` - Member skills and profession levels  
- `settlement_projects` - Active settlement projects
- `project_items` - Project requirements and materials
- `member_contributions` - Project contribution tracking
- `settlement_info` - Settlement configuration and metadata

### Treasury System
- `treasury_transactions` - All treasury transaction records
- `treasury_balance_history` - Historical balance tracking
- `treasury_categories` - Transaction category system
- `treasury_subcategories` - Detailed transaction classification

### System Tables
- `scraping_schedules` - Multi-interval data sync configuration
- `scraper_log` - Data sync history and debugging
- `bitjita_api_log` - API call tracking and debugging
- `settlement_config` - Application configuration

## Setup Instructions

1. **Create Supabase Project:**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Initialize project
   supabase init
   
   # Link to your project
   supabase link --project-ref your-project-ref
   ```

2. **Apply Migrations:**
   ```bash
   # Apply all migrations
   supabase db push
   
   # Or apply specific migration
   supabase migration up
   ```

3. **Seed Data (Optional):**
   ```bash
   # Run seed data script
   psql -h your-host -U postgres -d postgres -f seed-data.sql
   ```

## Migration Files

Migration files are numbered sequentially and should be applied in order:

1. `001_initial_schema.sql` - Basic table structure
2. `002_normalized_schema.sql` - Optimized schema
3. `003_settlement_graph_schema.sql` - Relationship improvements
4. Additional migrations as needed

## Data Sources

The database integrates with:
- **BitJita API** - External settlement data
- **SpacetimeDB** - Game data integration
- **Real-time subscriptions** - Live data updates

## Maintenance

- Regular cleanup of old log entries
- Periodic sync verification
- Performance monitoring for large settlements 