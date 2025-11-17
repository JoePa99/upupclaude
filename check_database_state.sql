-- Run this in Supabase SQL Editor to check if migration was applied

-- Check if metadata column exists on company_os_documents
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'company_os_documents'
  AND column_name = 'metadata';

-- Check if RLS policies exist on company_os_documents
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'company_os_documents';

-- Count how many RLS policies exist for company_os_documents
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'company_os_documents';

-- Check the actual document that's failing
SELECT id, workspace_id, filename, status, created_at, updated_at
FROM company_os_documents
WHERE id = 'e81d3059-35a8-4cfc-b290-6cedb4f9512f';
