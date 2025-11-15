'use client';

import { useState } from 'react';

export default function AdminDocuments() {
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;

    if (!file || !workspaceId) {
      setUploadStatus('Please select a file and workspace');
      setUploading(false);
      return;
    }

    try {
      // TODO: Implement file upload to Supabase Storage
      // TODO: Trigger extract-text Edge Function
      // TODO: Trigger generate-embeddings Edge Function

      setUploadStatus('Upload functionality coming soon...');
    } catch (error: any) {
      setUploadStatus(`Error: ${error.message}`);
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
              {/* TODO: Load workspaces dynamically */}
              <option value="temp">Temporary - Load from DB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Document File
            </label>
            <input
              type="file"
              name="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              className="w-full bg-background border border-border rounded px-4 py-2 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-background file:cursor-pointer"
              required
            />
            <p className="text-xs text-foreground-tertiary mt-1">
              Supported formats: PDF, Word, Text, Markdown
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
              <span className="text-sm text-foreground-secondary">
                {uploadStatus}
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
        <div className="text-sm text-foreground-tertiary">
          Document list coming soon...
        </div>
      </div>
    </div>
  );
}
