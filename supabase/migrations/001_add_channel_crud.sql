-- Migration: Add full CRUD support for channels
-- This migration adds is_dm and dm_assistant_id columns and comprehensive RLS policies

-- Add new columns to channels table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'is_dm'
  ) THEN
    ALTER TABLE channels ADD COLUMN is_dm boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'channels' AND column_name = 'dm_assistant_id'
  ) THEN
    ALTER TABLE channels ADD COLUMN dm_assistant_id uuid REFERENCES assistants(id);
  END IF;
END $$;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view channels in their workspace" ON channels;
DROP POLICY IF EXISTS "Users can create channels in their workspace" ON channels;
DROP POLICY IF EXISTS "Users can update channels in their workspace" ON channels;
DROP POLICY IF EXISTS "Users can delete channels in their workspace" ON channels;

DROP POLICY IF EXISTS "Users can view channel members" ON channel_members;
DROP POLICY IF EXISTS "Users can add channel members" ON channel_members;
DROP POLICY IF EXISTS "Users can remove channel members" ON channel_members;

DROP POLICY IF EXISTS "Users can view channel assistants" ON channel_assistants;
DROP POLICY IF EXISTS "Users can add channel assistants" ON channel_assistants;
DROP POLICY IF EXISTS "Users can remove channel assistants" ON channel_assistants;

-- Create channel policies
CREATE POLICY "Users can view channels in their workspace"
  ON channels FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create channels in their workspace"
  ON channels FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update channels in their workspace"
  ON channels FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete channels in their workspace"
  ON channels FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Create channel_members policies
CREATE POLICY "Users can view channel members"
  ON channel_members FOR SELECT
  USING (channel_id IN (
    SELECT id FROM channels WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can add channel members"
  ON channel_members FOR INSERT
  WITH CHECK (channel_id IN (
    SELECT id FROM channels WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can remove channel members"
  ON channel_members FOR DELETE
  USING (channel_id IN (
    SELECT id FROM channels WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- Create channel_assistants policies
CREATE POLICY "Users can view channel assistants"
  ON channel_assistants FOR SELECT
  USING (channel_id IN (
    SELECT id FROM channels WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can add channel assistants"
  ON channel_assistants FOR INSERT
  WITH CHECK (channel_id IN (
    SELECT id FROM channels WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

CREATE POLICY "Users can remove channel assistants"
  ON channel_assistants FOR DELETE
  USING (channel_id IN (
    SELECT id FROM channels WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));
