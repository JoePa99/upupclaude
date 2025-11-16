'use client';

import { useState, useEffect } from 'react';

interface Workspace {
  id: string;
  name: string;
}

interface Document {
  id: string;
  workspace_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  status: string;
  created_at: string;
  metadata?: any;
}

export default function AdminDocuments() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
    loadDocuments();
  }, []);

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

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch('/api/admin/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;

    if (!file || !workspaceId) {
      setUploadStatus({
        type: 'error',
        message: 'Please select a file and workspace',
      });
      setUploading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      if (result.warning) {
        setUploadStatus({
          type: 'warning',
          message: result.warning,
        });
      } else {
        setUploadStatus({
          type: 'success',
          message: result.message || 'Document uploaded successfully!',
        });
      }

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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          Document Management
        </h2>
        <p className="text-sm text-foreground-secondary">
          Upload and process CompanyOS documents
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-background-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
          Upload New Document
        </h3>

        <form onSubmit={handleFileUpload} className="space-y-4">
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
              Document File
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls,.csv"
              className="w-full bg-background border border-border rounded px-4 py-2 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-background file:cursor-pointer"
              required
            />
            <p className="text-xs text-foreground-tertiary mt-1">
              Supported formats: PDF, Word, PowerPoint, Excel, CSV, Text, Markdown
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
                    : uploadStatus.type === 'warning'
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {uploadStatus.message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Document List */}
      <div className="bg-background-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
          Uploaded Documents
        </h3>

        {loadingDocs ? (
          <div className="text-center py-8 text-sm text-foreground-tertiary">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-sm text-foreground-tertiary">
            No documents uploaded yet. Upload a document to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-background border border-border rounded p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-1">
                      {doc.filename}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-foreground-tertiary">
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <span>{doc.mime_type}</span>
                      <span>
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        doc.status === 'ready'
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                          : doc.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                            : doc.status === 'error'
                              ? 'bg-red-500/20 text-red-600 border border-red-500/30'
                              : 'bg-gray-500/20 text-gray-600 border border-gray-500/30'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>
                {doc.metadata?.error && (
                  <div className="mt-2 text-xs text-red-600">
                    Error: {doc.metadata.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
