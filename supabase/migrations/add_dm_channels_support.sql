-- Add support for direct message channels

-- Add fields to identify DM channels
ALTER TABLE channels
ADD COLUMN IF NOT EXISTS is_dm BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dm_assistant_id UUID REFERENCES assistants(id) ON DELETE CASCADE;

-- Add index for finding DM channels
CREATE INDEX IF NOT EXISTS idx_channels_dm ON channels(is_dm, dm_assistant_id) WHERE is_dm = true;

-- Add comment for documentation
COMMENT ON COLUMN channels.is_dm IS 'True if this is a direct message channel between a user and an assistant';
COMMENT ON COLUMN channels.dm_assistant_id IS 'The assistant ID for DM channels (null for regular channels)';
