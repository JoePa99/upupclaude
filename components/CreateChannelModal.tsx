'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { User, Assistant } from '@/types';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workspaceUsers: User[];
  workspaceAssistants: Assistant[];
}

export function CreateChannelModal({
  isOpen,
  onClose,
  onSuccess,
  workspaceUsers,
  workspaceAssistants,
}: CreateChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description.trim() || null,
          isPrivate,
          memberIds: selectedMemberIds,
          assistantIds: selectedAssistantIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create channel');
      }

      // Reset form
      setName('');
      setDescription('');
      setIsPrivate(false);
      setSelectedMemberIds([]);
      setSelectedAssistantIds([]);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAssistant = (assistantId: string) => {
    setSelectedAssistantIds((prev) =>
      prev.includes(assistantId)
        ? prev.filter((id) => id !== assistantId)
        : [...prev, assistantId]
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-serif font-semibold text-foreground">
                  Create Channel
                </h2>
                <p className="text-sm text-foreground-secondary mt-1">
                  Create a new channel for your team
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., general, sales-team, project-updates"
                    required
                    className="w-full bg-background-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this channel about?"
                    rows={3}
                    className="w-full bg-background-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors resize-none"
                  />
                </div>

                {/* Privacy */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground group-hover:text-accent transition-colors">
                        Private Channel
                      </div>
                      <div className="text-xs text-foreground-tertiary">
                        Only invited members can access this channel
                      </div>
                    </div>
                  </label>
                </div>

                {/* Members */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Add Members (Optional)
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-background-secondary border border-border rounded-lg p-3 space-y-2">
                    {workspaceUsers.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-background-tertiary rounded-lg p-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(user.id)}
                          onChange={() => toggleMember(user.id)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{user.name}</div>
                          <div className="text-xs text-foreground-tertiary">{user.email}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-foreground-tertiary mt-2">
                    You will be added as a member automatically
                  </p>
                </div>

                {/* Assistants */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Add AI Assistants (Optional)
                  </label>
                  <div className="max-h-40 overflow-y-auto bg-background-secondary border border-border rounded-lg p-3 space-y-2">
                    {workspaceAssistants.map((assistant) => (
                      <label
                        key={assistant.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-background-tertiary rounded-lg p-2 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssistantIds.includes(assistant.id)}
                          onChange={() => toggleAssistant(assistant.id)}
                          className="w-4 h-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-foreground">{assistant.name}</div>
                          <div className="text-xs text-foreground-tertiary">{assistant.role}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={creating}
                    className="flex-1 px-6 py-3 bg-background-secondary hover:bg-background-tertiary text-foreground rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !name}
                    className={cn(
                      'flex-1 px-6 py-3 bg-accent hover:bg-accent-hover text-background rounded-lg font-semibold transition-all',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {creating ? 'Creating...' : 'Create Channel'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
