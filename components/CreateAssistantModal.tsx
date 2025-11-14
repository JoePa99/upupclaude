'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreateAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MODEL_OPTIONS = {
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o (Most powerful, multimodal)' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast & efficient)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Workhorse)' },
  ],
  anthropic: [
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Most powerful)' },
    { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Fast & efficient)' },
  ],
  google: [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Experimental, Most powerful)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Production, Powerful)' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Fast & efficient)' },
  ],
};

export function CreateAssistantModal({ isOpen, onClose, onSuccess }: CreateAssistantModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [modelProvider, setModelProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [modelName, setModelName] = useState('gpt-4o');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);

    try {
      const response = await fetch('/api/assistants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          role,
          systemPrompt,
          modelProvider,
          modelName,
          temperature,
          maxTokens,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assistant');
      }

      // Reset form
      setName('');
      setRole('');
      setSystemPrompt('');
      setTemperature(0.7);
      setMaxTokens(4000);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
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
                  Create AI Assistant
                </h2>
                <p className="text-sm text-foreground-secondary mt-1">
                  Configure a new AI assistant for your workspace
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
                    Assistant Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Sales Assistant"
                    required
                    className="w-full bg-background-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Role Description
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g., Helps with customer inquiries and sales"
                    required
                    className="w-full bg-background-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* System Prompt */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    System Prompt
                  </label>
                  <textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="You are a helpful sales assistant. You help customers find the right products and answer their questions..."
                    required
                    rows={6}
                    className="w-full bg-background-secondary border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-foreground-tertiary mt-2">
                    Define how the assistant should behave and what it knows
                  </p>
                </div>

                {/* Model Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      AI Provider
                    </label>
                    <select
                      value={modelProvider}
                      onChange={(e) => {
                        const provider = e.target.value as 'openai' | 'anthropic' | 'google';
                        setModelProvider(provider);
                        setModelName(MODEL_OPTIONS[provider][0].value);
                      }}
                      className="w-full bg-background-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
                    >
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Model
                    </label>
                    <select
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      className="w-full bg-background-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-accent transition-colors"
                    >
                      {MODEL_OPTIONS[modelProvider].map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Advanced Settings */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground">Advanced Settings</h3>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-foreground-secondary">
                        Temperature: {temperature}
                      </label>
                      <span className="text-xs text-foreground-tertiary">
                        {temperature < 0.3 ? 'Focused' : temperature < 0.7 ? 'Balanced' : 'Creative'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-foreground-secondary mb-2">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      min="500"
                      max="10000"
                      step="500"
                      className="w-full bg-background-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                    />
                    <p className="text-xs text-foreground-tertiary mt-1">
                      Valid values: 500, 1000, 1500, 2000... up to 10,000
                    </p>
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
                    disabled={creating || !name || !role || !systemPrompt}
                    className={cn(
                      'flex-1 px-6 py-3 bg-accent hover:bg-accent-hover text-background rounded-lg font-semibold transition-all',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {creating ? 'Creating...' : 'Create Assistant'}
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
