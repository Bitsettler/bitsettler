-- Complete Settlement Management Database Schema
-- This file provides a complete overview of all tables for settlement management
-- Apply migration files in order: 001_settlement_core_schema.sql, 002_treasury_system.sql

-- =============================================================================
-- CORE SETTLEMENT TABLES
-- =============================================================================

-- Settlement Members (populated by BitJita API)
-- settlement_members: Member directory and basic info
-- member_professions: Detailed skill tracking for each member

-- Settlement Projects (project management system)
-- settlement_projects: Project definitions and status
-- project_items: Required items for each project
-- project_members: Member assignments to projects
-- member_contributions: Contribution tracking and history

-- =============================================================================
-- TREASURY SYSTEM TABLES  
-- =============================================================================

-- Treasury Management (financial tracking)
-- treasury_summary: Current treasury state
-- treasury_transactions: Detailed transaction records
-- treasury_balance_history: Historical balance snapshots
-- treasury_monthly_summary: Monthly aggregated data

-- Treasury Organization (categorization)
-- treasury_categories: Main transaction categories
-- treasury_subcategories: Detailed subcategories

-- =============================================================================
-- SYSTEM TABLES
-- =============================================================================

-- Configuration and Management
-- settlement_config: Settlement configuration and settings
-- scraper_log: Data sync history and debugging
-- scraping_schedules: Automated sync scheduling
-- bitjita_api_log: API call tracking and monitoring

-- =============================================================================
-- KEY RELATIONSHIPS
-- =============================================================================

-- settlement_members 1:N member_professions (skills)
-- settlement_members 1:N member_contributions (contributions)
-- settlement_projects 1:N project_items (requirements)
-- settlement_projects 1:N project_members (assignments)
-- settlement_projects 1:N member_contributions (project contributions)
-- settlement_projects 1:N treasury_transactions (project expenses/revenue)
-- treasury_categories 1:N treasury_subcategories (categorization)
-- treasury_categories 1:N treasury_transactions (transaction categorization)

-- =============================================================================
-- IMPORTANT VIEWS (created by migrations)
-- =============================================================================

-- project_summary_simple: Project overview with completion statistics
-- member_contributions_summary: Member contribution analytics
-- project_contributions_summary: Project contribution tracking

-- =============================================================================
-- MIGRATION ORDER
-- =============================================================================

-- 1. 001_settlement_core_schema.sql - Core tables and relationships
-- 2. 002_treasury_system.sql - Treasury management system

-- =============================================================================
-- INTEGRATION NOTES
-- =============================================================================

-- BitJita API Integration:
-- - settlement_members.bitjita_id links to BitJita player entities
-- - member_professions populated from BitJita citizen skills data
-- - treasury data can be synced from BitJita settlement treasury

-- Bitsettler Integration:
-- - project_items.item_name can reference main item compendium
-- - Cross-reference crafting recipes with settlement projects
-- - Link member skills to crafting requirements

-- Real-time Features:
-- - Supabase real-time subscriptions for live updates
-- - Automated sync schedules via scraping_schedules table
-- - API call logging for monitoring and debugging

COMMENT ON SCHEMA public IS 'Settlement Management System - Integrated with Bitsettler for comprehensive settlement and crafting management'; 