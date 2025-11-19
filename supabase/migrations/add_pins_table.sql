-- Migration: Add pins table for saving snippets from messages
-- This migration creates the pins table and sets up RLS policies

-- Create pins table if it doesn't exist
CREATE TABLE IF NOT EXISTS pins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  content text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('text', 'code', 'table', 'list')),
  collection text DEFAULT 'Quick Pins',
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS pins_user_id_idx ON pins(user_id);
CREATE INDEX IF NOT EXISTS pins_message_id_idx ON pins(message_id);
CREATE INDEX IF NOT EXISTS pins_created_at_idx ON pins(created_at DESC);
CREATE INDEX IF NOT EXISTS pins_collection_idx ON pins(collection);

-- Enable Row Level Security
ALTER TABLE pins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own pins" ON pins;
DROP POLICY IF EXISTS "Users can create their own pins" ON pins;
DROP POLICY IF EXISTS "Users can update their own pins" ON pins;
DROP POLICY IF EXISTS "Users can delete their own pins" ON pins;

-- Create RLS policies for pins
CREATE POLICY "Users can view their own pins"
  ON pins FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own pins"
  ON pins FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own pins"
  ON pins FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own pins"
  ON pins FOR DELETE
  USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON pins TO authenticated;
GRANT ALL ON pins TO service_role;
