-- Pyra Workspace: Authentication & Review System
-- Run this SQL in your Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS pyra_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    display_name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS pyra_reviews (
    id VARCHAR(20) PRIMARY KEY,
    file_path TEXT NOT NULL,
    username VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('comment', 'approval')),
    text TEXT DEFAULT '',
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_reviews_file_path ON pyra_reviews(file_path);
CREATE INDEX IF NOT EXISTS idx_reviews_username ON pyra_reviews(username);
CREATE INDEX IF NOT EXISTS idx_users_username ON pyra_users(username);
