-- Add NextAuth support to settlement members
-- Migration: 002_add_auth_support.sql

-- Add auth_user_id to link NextAuth users to settlement members
ALTER TABLE settlement_members 
ADD COLUMN auth_user_id TEXT UNIQUE;

-- Add index for performance
CREATE INDEX idx_settlement_members_auth_user_id ON settlement_members(auth_user_id);

-- Add updated_at trigger if not exists
-- (Should already exist from 001_settlement_core_schema.sql)