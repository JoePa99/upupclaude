'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreateAssistantModal } from '@/components/CreateAssistantModal';

interface Workspace {
  id: string;
  name: string;
  seats: number;
  price_per_seat: number;
  messages_used: number;
  message_limit: number;
  created_at: string;
}

interface Assistant {
  id: string;
  name: string;
  role: string;
  model: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
}

interface Document {
  id: string;
  filename: string;
  status: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  metadata?: any;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

interface Playbook {
  id: string;
  workspace_id: string;
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

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [playbookDocuments, setPlaybookDocuments] = useState<PlaybookDocument[]>([]);
  const [embeddingsCount, setEmbeddingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showCreateAssistant, setShowCreateAssistant] = useState(false);
  const [showCreatePlaybook, setShowCreatePlaybook] = useState(false);
  const [showEditWorkspace, setShowEditWorkspace] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingPlaybook, setUploadingPlaybook] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [playbookUploadStatus, setPlaybookUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCompanyData();
    loadPlaybooks();
  }, [workspaceId]);

  useEffect(() => {
    if (selectedPlaybook) {
      loadPlaybookDocuments(selectedPlaybook.id);
    }
  }, [selectedPlaybook]);

  // Poll for document processing status
  useEffect(() => {
    const processingDocs = documents.filter(doc => doc.status === 'processing');

    if (processingDocs.length > 0) {
      // Update status message to show processing count
      if (uploadStatus?.type === 'success') {
        setUploadStatus({
          type: 'success',
          message: `Processing ${processingDocs.length} document${processingDocs.length > 1 ? 's' : ''}...`,
        });
      }

      const interval = setInterval(() => {
        loadCompanyData();
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
    } else if (uploadStatus?.message.includes('Processing')) {
      // All processing complete
      setUploadStatus({
        type: 'success',
        message: 'All documents processed successfully!',
      });

      // Clear status after 5 seconds
      setTimeout(() => setUploadStatus(null), 5000);
    }
  }, [documents, workspaceId]);

  const loadCompanyData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${workspaceId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkspace(data.workspace);
        setAssistants(data.assistants || []);
        setDocuments(data.documents || []);
        setUsers(data.users || []);
        setEmbeddingsCount(data.embeddingsCount || 0);
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData(e.currentTarget);
    formData.append('workspaceId', workspaceId);

    try {
      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus({
        type: 'success',
        message: 'Document uploaded and processing started. This may take a few moments...',
      });

      // Reload data
      await loadCompanyData();

      // Reset form
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

  const handleDeleteAssistant = async (assistantId: string) => {
    if (!confirm('Are you sure you want to delete this assistant?')) return;

    try {
      const response = await fetch(`/api/admin/assistants/${assistantId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCompanyData();
      }
    } catch (error) {
      console.error('Failed to delete assistant:', error);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadCompanyData();
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const loadPlaybooks = async () => {
    try {
      const response = await fetch('/api/admin/playbooks');
      if (response.ok) {
        const data = await response.json();
        const workspacePlaybooks = (data.playbooks || []).filter(
          (p: Playbook) => p.workspace_id === workspaceId
        );
        setPlaybooks(workspacePlaybooks);
      }
    } catch (error) {
      console.error('Failed to load playbooks:', error);
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
          workspaceId,
          name: formData.get('name'),
          description: formData.get('description'),
        }),
      });

      if (response.ok) {
        setShowCreatePlaybook(false);
        loadPlaybooks();
        (e.target as HTMLFormElement).reset();
      }
    } catch (error) {
      console.error('Failed to create playbook:', error);
    }
  };

  const handleDeletePlaybook = async (playbookId: string) => {
    if (!confirm('Are you sure you want to delete this playbook?')) return;

    try {
      const response = await fetch(`/api/admin/playbooks/${playbookId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (selectedPlaybook?.id === playbookId) {
          setSelectedPlaybook(null);
        }
        loadPlaybooks();
      }
    } catch (error) {
      console.error('Failed to delete playbook:', error);
    }
  };

  const handlePlaybookDocumentUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPlaybook) return;

    setUploadingPlaybook(true);
    setPlaybookUploadStatus(null);

    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/admin/playbooks/${selectedPlaybook.id}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setPlaybookUploadStatus({
        type: 'success',
        message: 'Document uploaded successfully! Processing embeddings...',
      });

      loadPlaybookDocuments(selectedPlaybook.id);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      setPlaybookUploadStatus({
        type: 'error',
        message: error.message || 'Upload failed',
      });
    } finally {
      setUploadingPlaybook(false);
    }
  };

  const handleDeletePlaybookDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    if (!selectedPlaybook) return;

    try {
      const response = await fetch(
        `/api/admin/playbooks/${selectedPlaybook.id}/documents/${documentId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        loadPlaybookDocuments(selectedPlaybook.id);
      }
    } catch (error) {
      console.error('Failed to delete playbook document:', error);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!confirm('Are you sure you want to delete this workspace? This will delete all assistants, documents, and data.')) return;

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/dashboard');
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-foreground-secondary">Loading...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="text-center py-8">
        <div className="text-foreground-secondary">Company not found</div>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="mt-4 text-accent hover:text-accent/80"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="text-sm text-accent hover:text-accent/80 mb-2 inline-block"
        >
          ← Back to Companies
        </button>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-serif font-semibold text-foreground">
            {workspace.name}
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditWorkspace(true)}
              className="px-4 py-2 bg-background-secondary border border-border text-foreground rounded text-sm font-medium hover:bg-background transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteWorkspace}
              className="px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-foreground-secondary">
          <span>{users.length} users</span>
          <span>•</span>
          <span>{assistants.length} assistants</span>
          <span>•</span>
          <span>{documents.length} documents</span>
          <span>•</span>
          <span>{playbooks.length} playbooks</span>
          <span>•</span>
          <span>{embeddingsCount} embeddings</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            {workspace.seats}
          </div>
          <div className="text-sm text-foreground-secondary">Seats</div>
        </div>
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            {workspace.messages_used.toLocaleString()}
          </div>
          <div className="text-sm text-foreground-secondary">
            Messages Used (of {workspace.message_limit.toLocaleString()})
          </div>
        </div>
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            ${(workspace.price_per_seat / 100).toFixed(2)}
          </div>
          <div className="text-sm text-foreground-secondary">Price per Seat</div>
        </div>
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            {new Date(workspace.created_at).toLocaleDateString()}
          </div>
          <div className="text-sm text-foreground-secondary">Created</div>
        </div>
      </div>

      {/* Assistants */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            AI Assistants ({assistants.length})
          </h3>
          <button
            onClick={() => setShowCreateAssistant(true)}
            className="px-4 py-2 bg-accent text-background rounded text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Create Assistant
          </button>
        </div>

        {assistants.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
            No assistants created yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Model
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Config
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assistants.map((assistant) => (
                <tr key={assistant.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {assistant.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {assistant.role}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-mono">
                    {assistant.model}
                  </td>
                  <td className="px-6 py-4 text-xs text-foreground-tertiary">
                    temp: {assistant.temperature} / tokens: {assistant.max_tokens}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => router.push(`/admin/assistants/${assistant.id}`)}
                        className="text-accent hover:text-accent/80 text-sm font-medium"
                      >
                        View/Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAssistant(assistant.id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Documents */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-serif font-semibold text-foreground">
              CompanyOS Documents ({documents.length})
            </h3>
            {documents.filter(d => d.status === 'processing').length > 0 && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium border border-blue-500/30">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing {documents.filter(d => d.status === 'processing').length}
              </span>
            )}
          </div>

          <form onSubmit={handleFileUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Document
              </label>
              <input
                type="file"
                name="file"
                accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls,.csv"
                className="w-full bg-background border border-border rounded px-4 py-2 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-background file:cursor-pointer"
                required
              />
              <p className="text-xs text-foreground-tertiary mt-1">
                Supported: PDF, Word, PowerPoint, Excel, CSV, Text, Markdown
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-accent text-background rounded font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>

              {uploadStatus && (
                <span
                  className={`text-sm ${
                    uploadStatus.type === 'success'
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {uploadStatus.message}
                </span>
              )}
            </div>
          </form>
        </div>

        {documents.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
            No documents uploaded yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Filename
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Size
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Created
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {doc.filename}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {(doc.file_size / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground-secondary">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Playbooks */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            Playbooks ({playbooks.length})
          </h3>
          <button
            onClick={() => setShowCreatePlaybook(true)}
            className="px-4 py-2 bg-accent text-background rounded text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Create Playbook
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-border">
          {/* Playbooks List */}
          <div>
            {playbooks.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
                No playbooks created yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {playbooks.map((playbook) => (
                  <div
                    key={playbook.id}
                    className={`px-6 py-4 cursor-pointer transition-colors ${
                      selectedPlaybook?.id === playbook.id
                        ? 'bg-accent/10 border-l-4 border-accent'
                        : 'hover:bg-background/50'
                    }`}
                    onClick={() => setSelectedPlaybook(playbook)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">
                          {playbook.name}
                        </h4>
                        <p className="text-sm text-foreground-secondary mb-2">
                          {playbook.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-foreground-tertiary">
                          <span>{playbook.document_count || 0} documents</span>
                          <span>•</span>
                          <span>{new Date(playbook.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaybook(playbook.id);
                        }}
                        className="text-red-600 hover:text-red-700 text-xs ml-4"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Playbook Documents */}
          <div className="px-6 py-4">
            {!selectedPlaybook ? (
              <div className="text-center py-8 text-sm text-foreground-tertiary">
                Select a playbook to view and manage documents
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-1">
                    {selectedPlaybook.name}
                  </h4>
                  <p className="text-sm text-foreground-secondary mb-4">
                    {selectedPlaybook.description}
                  </p>
                </div>

                {/* Upload Form */}
                <form onSubmit={handlePlaybookDocumentUpload} className="space-y-3 pb-4 border-b border-border">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Upload Document
                    </label>
                    <input
                      type="file"
                      name="file"
                      accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls,.csv"
                      className="w-full bg-background border border-border rounded px-3 py-2 text-sm text-foreground file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-accent file:text-background file:cursor-pointer file:text-sm"
                      required
                    />
                    <p className="text-xs text-foreground-tertiary mt-1">
                      PDF, Word, PowerPoint, Excel, CSV, Text, Markdown
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={uploadingPlaybook}
                      className="px-4 py-2 bg-accent text-background rounded text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {uploadingPlaybook ? 'Uploading...' : 'Upload'}
                    </button>
                    {playbookUploadStatus && (
                      <span
                        className={`text-sm ${
                          playbookUploadStatus.type === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {playbookUploadStatus.message}
                      </span>
                    )}
                  </div>
                </form>

                {/* Documents List */}
                {playbookDocuments.length === 0 ? (
                  <div className="text-center py-6 text-sm text-foreground-tertiary">
                    No documents uploaded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playbookDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-background border border-border rounded p-3 flex items-start justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {doc.filename}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-foreground-tertiary mt-1">
                            <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                            {doc.total_chunks && <span>• {doc.total_chunks} chunks</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span
                            className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
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
                            onClick={() => handleDeletePlaybookDocument(doc.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            Users ({users.length})
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
            No users in this workspace
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {user.name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Assistant Modal */}
      <CreateAssistantModal
        isOpen={showCreateAssistant}
        onClose={() => setShowCreateAssistant(false)}
        onSuccess={() => {
          setShowCreateAssistant(false);
          loadCompanyData();
        }}
      />

      {/* Create Playbook Modal */}
      {showCreatePlaybook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-serif font-semibold text-foreground mb-4">
              Create New Playbook
            </h3>
            <form onSubmit={handleCreatePlaybook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Playbook Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                  placeholder="e.g., Sales Playbook"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                  rows={3}
                  placeholder="Describe what this playbook is for..."
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-background rounded font-medium hover:bg-accent/90 transition-colors"
                >
                  Create Playbook
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePlaybook(false)}
                  className="px-4 py-2 bg-background-secondary border border-border text-foreground rounded hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Workspace Modal */}
      {showEditWorkspace && workspace && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-serif font-semibold text-foreground mb-4">
              Edit Workspace
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: formData.get('name'),
                      seats: parseInt(formData.get('seats') as string),
                      message_limit: parseInt(formData.get('message_limit') as string),
                    }),
                  });
                  if (response.ok) {
                    setShowEditWorkspace(false);
                    loadCompanyData();
                  }
                } catch (error) {
                  console.error('Failed to update workspace:', error);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={workspace.name}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Seats
                </label>
                <input
                  type="number"
                  name="seats"
                  defaultValue={workspace.seats}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message Limit
                </label>
                <input
                  type="number"
                  name="message_limit"
                  defaultValue={workspace.message_limit}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                  required
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent text-background rounded font-medium hover:bg-accent/90 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditWorkspace(false)}
                  className="px-4 py-2 bg-background-secondary border border-border text-foreground rounded hover:bg-background transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
