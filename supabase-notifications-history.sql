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

-- Server-only access. Public users read the sanitized /api/notifications feed;
-- direct anon/authenticated access to internal delivery fields is not allowed.
REVOKE ALL ON TABLE notifications_history FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE notifications_history TO service_role;
