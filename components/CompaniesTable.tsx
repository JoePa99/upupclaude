'use client';

import { useState } from 'react';
import Link from 'next/link';

interface WorkspaceWithStats {
  id: string;
  name: string;
  created_at: string;
  seats: number;
  messages_used: number;
  message_limit: number;
  assistant_count?: number;
  document_count?: number;
  user_count?: number;
}

interface CompaniesTableProps {
  initialWorkspaces: WorkspaceWithStats[];
}

export function CompaniesTable({ initialWorkspaces }: CompaniesTableProps) {
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);

  const handleDelete = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to delete "${workspaceName}"? This will delete ALL associated data including users, assistants, documents, and messages. This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete workspace');
      }

      // Remove from local state
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId));
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      alert('Failed to delete workspace. Please try again.');
    }
  };

  return (
    <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-lg font-serif font-semibold text-foreground">
          Companies
        </h3>
        <p className="text-sm text-foreground-secondary">
          Click on a company to manage their assistants, documents, and users
        </p>
      </div>

      <div className="divide-y divide-border">
        {workspaces.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
            No companies found
          </div>
        ) : (
          workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="px-6 py-4 hover:bg-background/50 transition-colors flex items-center justify-between"
            >
              <Link
                href={`/admin/companies/${workspace.id}`}
                className="flex-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-1">
                      {workspace.name}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
                      <span>{workspace.user_count} users</span>
                      <span>•</span>
                      <span>{workspace.assistant_count} assistants</span>
                      <span>•</span>
                      <span>{workspace.document_count} documents</span>
                      <span>•</span>
                      <span>
                        {workspace.messages_used.toLocaleString()} / {workspace.message_limit.toLocaleString()} messages
                      </span>
                    </div>
                  </div>
                  <div className="text-accent text-sm mr-4">
                    View →
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(workspace.id, workspace.name);
                }}
                className="px-4 py-2 text-sm bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
