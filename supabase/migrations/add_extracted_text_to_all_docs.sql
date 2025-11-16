-- Add extracted_text column to agent_documents and playbook_documents
-- (company_os_documents already has this from a previous migration)

ALTER TABLE agent_documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;

ALTER TABLE playbook_documents
ADD COLUMN IF NOT EXISTS extracted_text TEXT;
