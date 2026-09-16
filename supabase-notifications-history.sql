-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create notifications_history table
CREATE TABLE IF NOT EXISTS notifications_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sent_at TEXT NOT NULL,
  heading_ar TEXT NOT NULL DEFAULT '',
  heading_en TEXT NOT NULL DEFAULT '',
  message_ar TEXT NOT NULL DEFAULT '',
  message_en TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '/ar',
  image TEXT,
  onesignal_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  recipients INTEGER,
  created_at TEXT NOT NULL,
  error TEXT
);

-- Create index for faster queries by sent_at
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications_history(sent_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications_history ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: the site's API routes call Supabase with the ANON key (this app
-- has no user logins) — an `auth.role() = 'authenticated'` policy would block
-- every insert with "new row violates row-level security policy". The admin
-- password gate lives in the API routes, not in the database.
-- Prefer running supabase-setup.sql (repo root) — it creates both tables and
-- all policies in one script. Policies kept here for standalone use:
DROP POLICY IF EXISTS "anon insert notifications_history" ON notifications_history;
CREATE POLICY "anon insert notifications_history" ON notifications_history
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "anon read notifications_history" ON notifications_history;
CREATE POLICY "anon read notifications_history" ON notifications_history
  FOR SELECT TO anon USING (true);
