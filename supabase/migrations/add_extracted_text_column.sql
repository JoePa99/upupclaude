-- Add extracted_text column to company_os_documents table
-- Run this in Supabase Dashboard → SQL Editor

ALTER TABLE company_os_documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

-- Add comment for documentation
COMMENT ON COLUMN company_os_documents.extracted_text IS 'Text extracted from the uploaded document (PDF, DOCX, TXT, MD, etc.)';
