# Database Setup Guide

## Required Migrations

### 1. Add extracted_text column to company_os_documents

**Location**: `supabase/migrations/add_extracted_text_column.sql`

**How to apply**:
1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the SQL from the migration file
4. Click **Run**

**SQL**:
```sql
ALTER TABLE company_os_documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

COMMENT ON COLUMN company_os_documents.extracted_text IS 'Text extracted from the uploaded document (PDF, DOCX, TXT, MD, etc.)';
```

**Why needed**: The `extract-text` Edge Function stores extracted document text in this column for later embedding generation.

---

## Complete Schema Reference

### company_os_documents table
```sql
CREATE TABLE company_os_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  filename text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  extracted_text text,  -- Added via migration
  status text NOT NULL DEFAULT 'processing', -- 'processing', 'ready', 'error'
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_company_os_documents_workspace ON company_os_documents(workspace_id);
CREATE INDEX idx_company_os_documents_status ON company_os_documents(status);
```

### embeddings table
```sql
CREATE TABLE embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  source_type text NOT NULL, -- 'company_os', 'agent_doc', 'playbook'
  metadata jsonb,
  assistant_id uuid REFERENCES assistants(id) ON DELETE CASCADE, -- NULL for company_os
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_embeddings_workspace ON embeddings(workspace_id);
CREATE INDEX idx_embeddings_source_type ON embeddings(source_type);
CREATE INDEX idx_embeddings_assistant ON embeddings(assistant_id);
CREATE INDEX idx_embeddings_vector ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

### search_embeddings function
```sql
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  workspace_uuid uuid,
  match_threshold float,
  match_count int,
  filter_source_type text DEFAULT NULL,
  filter_assistant_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  source_type text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    e.source_type,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE e.workspace_id = workspace_uuid
    AND (filter_source_type IS NULL OR e.source_type = filter_source_type)
    AND (filter_assistant_id IS NULL OR e.assistant_id = filter_assistant_id)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Storage Buckets

### documents bucket
Create in Supabase Dashboard → Storage:
- **Name**: `documents`
- **Privacy**: Private (not public)
- **Allowed MIME types**: All (or restrict to: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain, text/markdown)

---

## Row Level Security (RLS)

### company_os_documents
```sql
-- Enable RLS
ALTER TABLE company_os_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view documents in their workspace
CREATE POLICY "Users can view workspace documents"
ON company_os_documents FOR SELECT
USING (workspace_id IN (
  SELECT workspace_id FROM users WHERE id = auth.uid()
));

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role has full access"
ON company_os_documents FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

### embeddings
```sql
-- Enable RLS
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view embeddings in their workspace
CREATE POLICY "Users can view workspace embeddings"
ON embeddings FOR SELECT
USING (workspace_id IN (
  SELECT workspace_id FROM users WHERE id = auth.uid()
));

-- Policy: Service role has full access
CREATE POLICY "Service role has full access"
ON embeddings FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## Troubleshooting

### Error: "Could not find the 'extracted_text' column"
**Solution**: Run the migration `add_extracted_text_column.sql` in Supabase SQL Editor

### Error: "new row violates row-level security policy"
**Solution**: Make sure you're using `createAdminClient()` (service_role) for superadmin operations, not the regular client

### Error: "The model 'text-embedding-ada-002' does not exist"
**Solution**: Set `OPENAI_API_KEY` in Supabase Dashboard → Edge Functions → Secrets

---

## Edge Function Secrets

Set these in Supabase Dashboard → Edge Functions → Secrets:

- `OPENAI_API_KEY` - For embeddings (text-embedding-ada-002)
- `ANTHROPIC_API_KEY` - For Claude models
- `GOOGLE_API_KEY` - For Gemini models
- `SUPABASE_URL` - Auto-provided
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided
