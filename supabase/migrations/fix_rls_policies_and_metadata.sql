-- Migration: Fix RLS policies and add missing metadata columns
-- This fixes documents not being accessible due to RLS blocking everything

-- ============================================================================
-- Part 1: Add missing metadata columns
-- ============================================================================

-- Add metadata column to company_os_documents
ALTER TABLE company_os_documents
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add metadata column to agent_documents
ALTER TABLE agent_documents
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Add metadata column to playbook_documents
ALTER TABLE playbook_documents
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- ============================================================================
-- Part 2: Add RLS policies for company_os_documents
-- ============================================================================

-- Allow users to view company_os documents in their workspace
CREATE POLICY "Users can view company_os documents in their workspace"
  ON company_os_documents FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to insert company_os documents in their workspace
CREATE POLICY "Users can insert company_os documents in their workspace"
  ON company_os_documents FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to update company_os documents in their workspace
CREATE POLICY "Users can update company_os documents in their workspace"
  ON company_os_documents FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to delete company_os documents in their workspace
CREATE POLICY "Users can delete company_os documents in their workspace"
  ON company_os_documents FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- ============================================================================
-- Part 3: Add RLS policies for agent_documents
-- ============================================================================

-- Allow users to view agent documents for assistants in their workspace
CREATE POLICY "Users can view agent documents in their workspace"
  ON agent_documents FOR SELECT
  USING (assistant_id IN (
    SELECT id FROM assistants WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow users to insert agent documents for assistants in their workspace
CREATE POLICY "Users can insert agent documents in their workspace"
  ON agent_documents FOR INSERT
  WITH CHECK (assistant_id IN (
    SELECT id FROM assistants WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow users to update agent documents for assistants in their workspace
CREATE POLICY "Users can update agent documents in their workspace"
  ON agent_documents FOR UPDATE
  USING (assistant_id IN (
    SELECT id FROM assistants WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow users to delete agent documents for assistants in their workspace
CREATE POLICY "Users can delete agent documents in their workspace"
  ON agent_documents FOR DELETE
  USING (assistant_id IN (
    SELECT id FROM assistants WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- Part 4: Add RLS policies for playbooks
-- ============================================================================

-- Allow users to view playbooks in their workspace
CREATE POLICY "Users can view playbooks in their workspace"
  ON playbooks FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to insert playbooks in their workspace
CREATE POLICY "Users can insert playbooks in their workspace"
  ON playbooks FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to update playbooks in their workspace
CREATE POLICY "Users can update playbooks in their workspace"
  ON playbooks FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to delete playbooks in their workspace
CREATE POLICY "Users can delete playbooks in their workspace"
  ON playbooks FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- ============================================================================
-- Part 5: Add RLS policies for playbook_documents
-- ============================================================================

-- Allow users to view playbook documents for playbooks in their workspace
CREATE POLICY "Users can view playbook documents in their workspace"
  ON playbook_documents FOR SELECT
  USING (playbook_id IN (
    SELECT id FROM playbooks WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow users to insert playbook documents for playbooks in their workspace
CREATE POLICY "Users can insert playbook documents in their workspace"
  ON playbook_documents FOR INSERT
  WITH CHECK (playbook_id IN (
    SELECT id FROM playbooks WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow users to update playbook documents for playbooks in their workspace
CREATE POLICY "Users can update playbook documents in their workspace"
  ON playbook_documents FOR UPDATE
  USING (playbook_id IN (
    SELECT id FROM playbooks WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- Allow users to delete playbook documents for playbooks in their workspace
CREATE POLICY "Users can delete playbook documents in their workspace"
  ON playbook_documents FOR DELETE
  USING (playbook_id IN (
    SELECT id FROM playbooks WHERE workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  ));

-- ============================================================================
-- Part 6: Add RLS policies for embeddings
-- ============================================================================

-- Allow users to view embeddings in their workspace
CREATE POLICY "Users can view embeddings in their workspace"
  ON embeddings FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to insert embeddings in their workspace
CREATE POLICY "Users can insert embeddings in their workspace"
  ON embeddings FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Allow users to delete embeddings in their workspace
CREATE POLICY "Users can delete embeddings in their workspace"
  ON embeddings FOR DELETE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));
