'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Channel } from '@/types';

interface EditChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  channel: Channel;
}

export function EditChannelModal({
  isOpen,
  onClose,
  onSuccess,
  channel,
}: EditChannelModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when channel changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(channel.name);
      setDescription(channel.description || '');
      setIsPrivate(channel.isPrivate);
      setError(null);
    }
  }, [isOpen, channel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUpdating(true);

    try {
      const response = await fetch(`/api/channels/${channel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPrivate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update channel');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border rounded-xl shadow-2xl max-w-lg w-full"
            >
              {/* Header */}
              <div className="p-6 border-b border-border">
                <h2 className="text-2xl font-serif font-semibold text-foreground">
                  Edit Channel
                </h2>
                <p className="text-sm text-foreground-secondary mt-1">
                  Update channel settings
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

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={updating}
                    className="flex-1 px-6 py-3 bg-background-secondary hover:bg-background-tertiary text-foreground rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating || !name}
                    className={cn(
                      'flex-1 px-6 py-3 bg-accent hover:bg-accent-hover text-background rounded-lg font-semibold transition-all',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {updating ? 'Updating...' : 'Update Channel'}
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
