'use client';

import { useState, useEffect } from 'react';

interface Workspace {
  id: string;
  name: string;
}

interface Playbook {
  id: string;
  workspace_id: string;
  workspace_name?: string;
  name: string;
  description: string;
  created_at: string;
  document_count?: number;
}

interface PlaybookDocument {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  total_chunks?: number;
  created_at: string;
  metadata?: any;
}

export default function AdminPlaybooks() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [playbookDocuments, setPlaybookDocuments] = useState<PlaybookDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadWorkspaces();
    loadPlaybooks();
  }, []);

  useEffect(() => {
    if (selectedPlaybook) {
      loadPlaybookDocuments(selectedPlaybook.id);
    }
  }, [selectedPlaybook]);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/admin/workspaces');
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces || []);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const loadPlaybooks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/playbooks');
      if (response.ok) {
        const data = await response.json();
        setPlaybooks(data.playbooks || []);
      }
    } catch (error) {
      console.error('Failed to load playbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaybookDocuments = async (playbookId: string) => {
    try {
      const response = await fetch(`/api/admin/playbooks/${playbookId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setPlaybookDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load playbook documents:', error);
    }
  };

  const handleCreatePlaybook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/admin/playbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: formData.get('workspaceId'),
          name: formData.get('name'),
          description: formData.get('description'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create playbook');
      }

      setShowCreateModal(false);
      loadPlaybooks();
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      alert(error.message || 'Failed to create playbook');
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlaybook) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      setUploadStatus({ type: 'error', message: 'Please select a file' });
      setUploading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/playbooks/${selectedPlaybook.id}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus({
        type: 'success',
        message: 'Document uploaded successfully! Processing embeddings...',
      });

      loadPlaybookDocuments(selectedPlaybook.id);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setUploadStatus({
        type: 'error',
        message: error.message || 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!selectedPlaybook) return;
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(
        `/api/admin/playbooks/${selectedPlaybook.id}/documents/${documentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      loadPlaybookDocuments(selectedPlaybook.id);
    } catch (error: any) {
      alert(error.message || 'Failed to delete document');
    }
  };

  const handleDeletePlaybook = async (playbookId: string) => {
    if (!confirm('Are you sure you want to delete this playbook and all its documents?')) return;

    try {
      const response = await fetch(`/api/admin/playbooks/${playbookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete playbook');
      }

      if (selectedPlaybook?.id === playbookId) {
        setSelectedPlaybook(null);
        setPlaybookDocuments([]);
      }
      loadPlaybooks();
    } catch (error: any) {
      alert(error.message || 'Failed to delete playbook');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Playbooks (Data Lake)
          </h2>
          <p className="text-sm text-foreground-secondary">
            Team-contributed knowledge shared across assistants
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-accent text-background rounded font-medium hover:bg-accent/90 transition-colors"
        >
          Create Playbook
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Playbooks List */}
        <div className="col-span-1 bg-background-secondary border border-border rounded-lg p-6">
          <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
            All Playbooks
          </h3>

          {loading ? (
            <div className="text-center py-8 text-sm text-foreground-tertiary">
              Loading...
            </div>
          ) : playbooks.length === 0 ? (
            <div className="text-center py-8 text-sm text-foreground-tertiary">
              No playbooks yet
            </div>
          ) : (
            <div className="space-y-2">
              {playbooks.map((playbook) => (
                <div
                  key={playbook.id}
                  className={`p-3 border rounded cursor-pointer transition-colors ${
                    selectedPlaybook?.id === playbook.id
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  }`}
                  onClick={() => setSelectedPlaybook(playbook)}
                >
                  <div className="font-medium text-foreground text-sm">
                    {playbook.name}
                  </div>
                  <div className="text-xs text-foreground-tertiary mt-1">
                    {playbook.workspace_name || 'Workspace'}
                  </div>
                  {playbook.document_count !== undefined && (
                    <div className="text-xs text-foreground-secondary mt-1">
                      {playbook.document_count} documents
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Playbook Details */}
        <div className="col-span-2">
          {!selectedPlaybook ? (
            <div className="bg-background-secondary border border-border rounded-lg p-12 text-center">
              <div className="text-foreground-tertiary">
                Select a playbook to view and manage documents
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Playbook Info */}
              <div className="bg-background-secondary border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-serif font-semibold text-foreground">
                      {selectedPlaybook.name}
                    </h3>
                    <p className="text-sm text-foreground-secondary mt-1">
                      {selectedPlaybook.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePlaybook(selectedPlaybook.id)}
                    className="text-xs text-red-600 hover:text-red-700 transition-colors px-3 py-1"
                  >
                    Delete Playbook
                  </button>
                </div>
                <div className="text-xs text-foreground-tertiary">
                  Created {new Date(selectedPlaybook.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Upload Form */}
              <div className="bg-background-secondary border border-border rounded-lg p-6">
                <h4 className="text-sm font-semibold text-foreground mb-4">
                  Upload Document
                </h4>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        name="file"
                        accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls,.csv"
                        className="w-full bg-background border border-border rounded px-4 py-2 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-background file:cursor-pointer"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-2 bg-accent text-background rounded font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                  {uploadStatus && (
                    <div
                      className={`text-sm ${
                        uploadStatus.type === 'success'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {uploadStatus.message}
                    </div>
                  )}
                </form>
              </div>

              {/* Documents List */}
              <div className="bg-background-secondary border border-border rounded-lg p-6">
                <h4 className="text-sm font-semibold text-foreground mb-4">
                  Documents
                </h4>
                {playbookDocuments.length === 0 ? (
                  <div className="text-center py-8 text-sm text-foreground-tertiary">
                    No documents uploaded yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playbookDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-background border border-border rounded p-4 flex items-start justify-between"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-foreground mb-1">
                            {doc.filename}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-foreground-tertiary">
                            <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                            <span>{doc.mime_type}</span>
                            {doc.total_chunks && <span>{doc.total_chunks} chunks</span>}
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              doc.status === 'ready'
                                ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                                : doc.status === 'processing'
                                  ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                                  : 'bg-red-500/20 text-red-600 border border-red-500/30'
                            }`}
                          >
                            {doc.status}
                          </span>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-xs text-red-600 hover:text-red-700 transition-colors px-2 py-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Playbook Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
              Create New Playbook
            </h3>
            <form onSubmit={handleCreatePlaybook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Workspace
                </label>
                <select
                  name="workspaceId"
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                  required
                >
                  <option value="">Select workspace...</option>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g., Sales Playbook, Engineering Best Practices"
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  placeholder="What kind of knowledge does this playbook contain?"
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground h-24 resize-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded font-medium hover:bg-background-secondary transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-accent text-background rounded font-medium hover:bg-accent/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
