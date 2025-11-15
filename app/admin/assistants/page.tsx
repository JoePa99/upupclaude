'use client';

import { useState, useEffect } from 'react';
import CreateAssistantModal from '@/components/CreateAssistantModal';

interface Assistant {
  id: string;
  name: string;
  role: string;
  workspace_id: string;
  workspace_name?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
}

export default function AdminAssistants() {
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/assistants');
      if (response.ok) {
        const data = await response.json();
        setAssistants(data.assistants || []);
      }
    } catch (error) {
      console.error('Failed to load assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssistantCreated = () => {
    setShowCreateModal(false);
    loadAssistants();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Assistant Management
          </h2>
          <p className="text-sm text-foreground-secondary">
            Create and manage AI assistants across all workspaces
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-accent text-background rounded font-medium hover:bg-accent/90 transition-colors"
        >
          Create Assistant
        </button>
      </div>

      {/* Assistants Table */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Role
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Workspace
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Model
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Config
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-foreground-tertiary"
                >
                  Loading assistants...
                </td>
              </tr>
            ) : assistants.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-foreground-tertiary"
                >
                  No assistants found. Create your first assistant to get started.
                </td>
              </tr>
            ) : (
              assistants.map((assistant) => (
                <tr key={assistant.id} className="hover:bg-background/50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {assistant.name}
                    </div>
                    <div className="text-xs text-foreground-tertiary">
                      {assistant.id.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {assistant.role}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {assistant.workspace_name || assistant.workspace_id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-mono">
                    {assistant.model}
                  </td>
                  <td className="px-6 py-4 text-xs text-foreground-tertiary">
                    temp: {assistant.temperature} / tokens: {assistant.max_tokens}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground-secondary">
                    {new Date(assistant.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Assistant Modal */}
      {showCreateModal && (
        <CreateAssistantModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleAssistantCreated}
        />
      )}
    </div>
  );
}
