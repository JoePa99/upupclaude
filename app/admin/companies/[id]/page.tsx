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
  full_name: string | null;
  created_at: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [embeddingsCount, setEmbeddingsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showCreateAssistant, setShowCreateAssistant] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadCompanyData();
  }, [workspaceId]);

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
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          {workspace.name}
        </h2>
        <div className="flex items-center gap-4 text-sm text-foreground-secondary">
          <span>{users.length} users</span>
          <span>•</span>
          <span>{assistants.length} assistants</span>
          <span>•</span>
          <span>{documents.length} documents</span>
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
                    <button
                      onClick={() => handleDeleteAssistant(assistant.id)}
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
                    {user.full_name || '—'}
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
    </div>
  );
}
