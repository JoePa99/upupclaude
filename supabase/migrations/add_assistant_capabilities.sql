-- Add capability flags to assistants table
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS enable_image_generation BOOLEAN DEFAULT false;
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS enable_web_search BOOLEAN DEFAULT false;
ALTER TABLE assistants ADD COLUMN IF NOT EXISTS enable_deep_research BOOLEAN DEFAULT false;

-- Remove temperature and max_tokens since we'll use model defaults
-- (We'll keep the columns for backward compatibility but ignore them in the app)
