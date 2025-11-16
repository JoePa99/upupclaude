'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

interface Assistant {
  id: string;
  name: string;
  role: string;
  system_prompt: string;
  workspace_id: string;
  workspace_name?: string;
  model_provider: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
}

interface AgentDocument {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  total_chunks?: number;
  created_at: string;
  metadata?: any;
}

export default function AssistantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  useEffect(() => {
    loadAssistant();
    loadDocuments();
  }, [id]);

  const loadAssistant = async () => {
    try {
      const response = await fetch(`/api/admin/assistants/${id}`);
      if (response.ok) {
        const data = await response.json();
        setAssistant(data.assistant);
      }
    } catch (error) {
      console.error('Failed to load assistant:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/admin/assistants/${id}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file',
      });
      setUploading(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/assistants/${id}/documents/upload`, {
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

      // Reload documents list
      loadDocuments();

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

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This will also remove all its embeddings.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/assistants/${id}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Reload documents list
      loadDocuments();
    } catch (error: any) {
      alert(error.message || 'Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground-secondary">Loading...</div>
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">Assistant not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/assistants"
          className="text-sm text-accent hover:text-accent/80 transition-colors mb-4 inline-block"
        >
          ← Back to Assistants
        </Link>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          {assistant.name}
        </h2>
        <p className="text-sm text-foreground-secondary">{assistant.role}</p>
      </div>

      {/* Assistant Details */}
      <div className="bg-background-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
          Configuration
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">
              Model
            </div>
            <div className="text-sm text-foreground font-mono">
              {assistant.model_provider} / {assistant.model_name}
            </div>
          </div>
          <div>
            <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">
              Temperature
            </div>
            <div className="text-sm text-foreground">{assistant.temperature}</div>
          </div>
          <div>
            <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">
              Max Tokens
            </div>
            <div className="text-sm text-foreground">{assistant.max_tokens}</div>
          </div>
          <div>
            <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">
              Created
            </div>
            <div className="text-sm text-foreground">
              {new Date(assistant.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="mt-6">
          <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-2">
            System Prompt
          </div>
          <div className="text-sm text-foreground bg-background border border-border rounded p-4 whitespace-pre-wrap font-mono text-xs">
            {assistant.system_prompt}
          </div>
        </div>
      </div>

      {/* Agent-Specific Documents */}
      <div className="bg-background-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
          Agent-Specific Knowledge
        </h3>
        <p className="text-sm text-foreground-secondary mb-6">
          These documents provide specialized knowledge only to this assistant. They supplement
          the CompanyOS foundation layer.
        </p>

        {/* Upload Form */}
        <form onSubmit={handleFileUpload} className="mb-6 pb-6 border-b border-border">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-2">
                Upload Document
              </label>
              <input
                type="file"
                name="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                className="w-full bg-background border border-border rounded px-4 py-2 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-background file:cursor-pointer"
                required
              />
              <p className="text-xs text-foreground-tertiary mt-1">
                PDF, Word, Text, or Markdown files
              </p>
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
              className={`mt-3 text-sm ${
                uploadStatus.type === 'success'
                  ? 'text-green-600'
                  : uploadStatus.type === 'warning'
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {uploadStatus.message}
            </div>
          )}
        </form>

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="text-center py-8 text-sm text-foreground-tertiary">
            No agent-specific documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
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
                  {doc.metadata?.error && (
                    <div className="mt-2 text-xs text-red-600">
                      Error: {doc.metadata.error}
                    </div>
                  )}
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
  );
}
