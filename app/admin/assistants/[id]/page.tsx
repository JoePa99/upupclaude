'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';

interface Assistant {
  id: string;
  name: string;
  role: string;
  system_prompt: string;
  workspace_id: string;
  workspace_name?: string;
  model_provider: string;
  model_name: string;
  enable_image_generation?: boolean;
  enable_web_search?: boolean;
  enable_deep_research?: boolean;
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

const MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-5.1', label: 'GPT-5.1 Thinking' },
    { value: 'gpt-5.1-chat-latest', label: 'GPT-5.1 Instant' },
    { value: 'gpt-5-nano', label: 'GPT-5 Nano' },
    { value: 'gpt-4o', label: 'GPT-4o' },
  ],
  anthropic: [
    { value: 'claude-opus-4-1', label: 'Claude Opus 4.1' },
    { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
    { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
  ],
  google: [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
  ],
};

export default function AssistantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [documents, setDocuments] = useState<AgentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editSystemPrompt, setEditSystemPrompt] = useState('');
  const [editModelProvider, setEditModelProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [editModelName, setEditModelName] = useState('');
  const [editEnableImageGeneration, setEditEnableImageGeneration] = useState(false);
  const [editEnableWebSearch, setEditEnableWebSearch] = useState(false);
  const [editEnableDeepResearch, setEditEnableDeepResearch] = useState(false);

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
        // Initialize edit state
        setEditName(data.assistant.name);
        setEditRole(data.assistant.role);
        setEditSystemPrompt(data.assistant.system_prompt);
        setEditModelProvider(data.assistant.model_provider);
        setEditModelName(data.assistant.model_name);
        setEditEnableImageGeneration(data.assistant.enable_image_generation ?? false);
        setEditEnableWebSearch(data.assistant.enable_web_search ?? false);
        setEditEnableDeepResearch(data.assistant.enable_deep_research ?? false);
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/assistants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          role: editRole,
          systemPrompt: editSystemPrompt,
          modelProvider: editModelProvider,
          modelName: editModelName,
          enableImageGeneration: editEnableImageGeneration,
          enableWebSearch: editEnableWebSearch,
          enableDeepResearch: editEnableDeepResearch,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        loadAssistant();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update assistant');
      }
    } catch (error) {
      console.error('Failed to update assistant:', error);
      alert('Failed to update assistant');
    } finally {
      setSaving(false);
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

      loadDocuments();
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
        <button
          onClick={() => router.push(`/admin/companies/${assistant.workspace_id}`)}
          className="text-sm text-accent hover:text-accent/80 transition-colors mb-4 inline-block"
        >
          ← Back to Company
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
              {assistant.name}
            </h2>
            <p className="text-sm text-foreground-secondary">{assistant.role}</p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-accent text-background rounded text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Edit Configuration
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // Reset edit state
                    setEditName(assistant.name);
                    setEditRole(assistant.role);
                    setEditSystemPrompt(assistant.system_prompt);
                    setEditModelProvider(assistant.model_provider as any);
                    setEditModelName(assistant.model_name);
                    setEditEnableImageGeneration(assistant.enable_image_generation ?? false);
                    setEditEnableWebSearch(assistant.enable_web_search ?? false);
                    setEditEnableDeepResearch(assistant.enable_deep_research ?? false);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-background-secondary border border-border text-foreground rounded text-sm font-medium hover:bg-background transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-accent text-background rounded text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assistant Details */}
      <div className="bg-background-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
          Configuration
        </h3>

        {!isEditing ? (
          // View Mode
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">
                  Name
                </div>
                <div className="text-sm text-foreground">{assistant.name}</div>
              </div>
              <div>
                <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-1">
                  Role
                </div>
                <div className="text-sm text-foreground">{assistant.role}</div>
              </div>
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
                  Created
                </div>
                <div className="text-sm text-foreground">
                  {new Date(assistant.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-2">
                Capabilities
              </div>
              <div className="flex flex-wrap gap-2">
                {assistant.enable_image_generation && (
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                    Image Generation
                  </span>
                )}
                {assistant.enable_web_search && (
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                    Web Search
                  </span>
                )}
                {assistant.enable_deep_research && (
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium">
                    Deep Research
                  </span>
                )}
                {!assistant.enable_image_generation && !assistant.enable_web_search && !assistant.enable_deep_research && (
                  <span className="text-xs text-foreground-tertiary">No additional capabilities enabled</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-foreground-tertiary uppercase tracking-wider mb-2">
                System Prompt
              </div>
              <div className="text-sm text-foreground bg-background border border-border rounded p-4 whitespace-pre-wrap font-mono text-xs">
                {assistant.system_prompt}
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Assistant Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Role Description
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  AI Provider
                </label>
                <select
                  value={editModelProvider}
                  onChange={(e) => {
                    const provider = e.target.value as 'openai' | 'anthropic' | 'google';
                    setEditModelProvider(provider);
                    setEditModelName(MODEL_OPTIONS[provider][0].value);
                  }}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Model
                </label>
                <select
                  value={editModelName}
                  onChange={(e) => setEditModelName(e.target.value)}
                  className="w-full bg-background border border-border rounded px-4 py-2 text-foreground"
                >
                  {MODEL_OPTIONS[editModelProvider].map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                System Prompt
              </label>
              <textarea
                value={editSystemPrompt}
                onChange={(e) => setEditSystemPrompt(e.target.value)}
                rows={8}
                className="w-full bg-background border border-border rounded px-4 py-3 text-foreground font-mono text-xs resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Capabilities
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={editEnableImageGeneration}
                    onChange={(e) => setEditEnableImageGeneration(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">Image Generation</div>
                    <div className="text-xs text-foreground-tertiary">
                      Generate images using gemini-2.5-flash-image
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={editEnableWebSearch}
                    onChange={(e) => setEditEnableWebSearch(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">Web Search</div>
                    <div className="text-xs text-foreground-tertiary">
                      Search the web for real-time information
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={editEnableDeepResearch}
                    onChange={(e) => setEditEnableDeepResearch(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-accent"
                  />
                  <div>
                    <div className="text-sm font-medium text-foreground">Deep Research</div>
                    <div className="text-xs text-foreground-tertiary">
                      Enable extended reasoning with O3 deep research model
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}
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
                accept=".pdf,.doc,.docx,.txt,.md,.pptx,.ppt,.xlsx,.xls,.csv"
                className="w-full bg-background border border-border rounded px-4 py-2 text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-accent file:text-background file:cursor-pointer"
                required
              />
              <p className="text-xs text-foreground-tertiary mt-1">
                PDF, Word, PowerPoint, Excel, CSV, Text, or Markdown files
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
