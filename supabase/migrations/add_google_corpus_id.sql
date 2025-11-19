-- Add google_corpus_id to workspaces table for Gemini File Search integration
-- This allows workspaces to use Gemini's native grounding instead of custom RAG

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS google_corpus_id TEXT;

COMMENT ON COLUMN workspaces.google_corpus_id IS 'Google Gemini Corpus ID for File Search API grounding. When set, Gemini assistants will use native grounding instead of custom RAG.';
