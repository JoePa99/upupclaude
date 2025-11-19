'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Assistant } from '@/types';

interface OmniComposerProps {
  assistants: Assistant[];
  onSendMessage: (content: string, mentions: string[]) => Promise<void>;
  disabled?: boolean;
}

/**
 * NEXUS Omni-Composer - Floating pill input with context-aware styling
 * Changes border color based on mentioned @Agent
 */
export function OmniComposer({ assistants, onSendMessage, disabled }: OmniComposerProps) {
  const [message, setMessage] = useState('');
  const [mentionedAgents, setMentionedAgents] = useState<Assistant[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Assistant[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get accent color based on mentioned agent
  const getAccentColor = () => {
    if (mentionedAgents.length === 0) return 'rgba(198, 88, 255, 0.3)'; // Default purple

    // Use first mentioned agent's color theme
    const agent = mentionedAgents[0];
    const colorMap: Record<string, string> = {
      cyan: 'rgba(86, 227, 255, 0.8)',
      purple: 'rgba(198, 88, 255, 0.8)',
      coral: 'rgba(255, 90, 95, 0.8)',
      yellow: 'rgba(255, 193, 7, 0.8)',
    };
    return colorMap[agent.colorTheme || 'purple'] || colorMap.purple;
  };

  // Parse @mentions from message
  useEffect(() => {
    const mentionRegex = /@(\w+)/g;
    const matches = Array.from(message.matchAll(mentionRegex));

    const mentioned = matches
      .map(match => {
        const name = match[1].toLowerCase();
        return assistants.find(a => a.name.toLowerCase().startsWith(name));
      })
      .filter((a): a is Assistant => a !== undefined);

    setMentionedAgents(mentioned);
  }, [message, assistants]);

  // Handle @ trigger for suggestions
  useEffect(() => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = message.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1 && cursorPos - lastAtIndex <= 20) {
      const query = textBeforeCursor.slice(lastAtIndex + 1).toLowerCase();
      const filtered = assistants.filter(a => {
        // Show all assistants when just @ is typed
        if (query === '') return true;
        // Use includes for more flexible matching (matches anywhere in name)
        return a.name.toLowerCase().includes(query);
      });
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0); // Reset selection when suggestions change
    } else {
      setShowSuggestions(false);
    }
  }, [message, assistants]);

  const handleSend = async () => {
    if (!message.trim() || disabled) return;

    const mentionIds = mentionedAgents.map(a => a.id);
    await onSendMessage(message.trim(), mentionIds);
    setMessage('');
    setMentionedAgents([]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard navigation in suggestions dropdown
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredSuggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        return;
      }
    }

    // Handle normal Enter to send message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertMention = (assistant: Assistant) => {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = message.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const beforeAt = message.slice(0, lastAtIndex);
    const afterCursor = message.slice(cursorPos);
    const newMessage = `${beforeAt}@${assistant.name} ${afterCursor}`;

    setMessage(newMessage);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Get color for assistant avatar
  const getAssistantColor = (colorTheme?: string) => {
    const colorMap: Record<string, string> = {
      cyan: '#56E3FF',
      purple: '#C658FF',
      coral: '#FF5A5F',
      yellow: '#FFC107',
    };
    return colorMap[colorTheme || 'purple'] || colorMap.purple;
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-6">
      {/* Agent Suggestions */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 bg-white/90 backdrop-blur-2xl border border-white/95 rounded-3xl shadow-luminous p-2"
          >
            {filteredSuggestions.map((assistant, index) => (
              <button
                key={assistant.id}
                onClick={() => insertMention(assistant)}
                className={`w-full px-4 py-3 text-left rounded-2xl transition-all flex items-center gap-3 ${
                  index === selectedIndex
                    ? 'bg-white shadow-md scale-[1.02]'
                    : 'hover:bg-white/70'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-extrabold text-white shadow-md"
                  style={{ backgroundColor: getAssistantColor(assistant.colorTheme) }}
                >
                  {assistant.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-luminous-text-primary text-sm">
                    @{assistant.name}
                  </div>
                  <div className="text-xs text-luminous-text-secondary">
                    {assistant.role}
                  </div>
                </div>
                {index === selectedIndex && (
                  <div className="text-luminous-accent-purple text-sm">
                    ⏎
                  </div>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Pill */}
      <motion.div
        className="relative bg-white/65 backdrop-blur-2xl rounded-luminous shadow-luminous overflow-hidden"
        style={{
          borderWidth: 2,
          borderColor: getAccentColor(),
        }}
        whileHover={{ scale: 1.005, y: -2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Agent Context Badge */}
        <AnimatePresence>
          {mentionedAgents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 pt-4 pb-2 flex items-center gap-2 flex-wrap"
            >
              {mentionedAgents.map(agent => (
                <div
                  key={agent.id}
                  className="px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-2"
                  style={{ backgroundColor: getAssistantColor(agent.colorTheme) }}
                >
                  <span>{agent.name}</span>
                  <span className="opacity-70">{agent.role}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="flex items-end gap-4 p-6">
          <textarea
            ref={inputRef}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Message your AI teammates... (use @mention)"
            className="flex-1 bg-transparent resize-none outline-none text-luminous-text-primary placeholder:text-luminous-text-tertiary font-medium text-base max-h-32 disabled:opacity-50"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '24px',
            }}
          />

          {/* Send Button */}
          <motion.button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white disabled:opacity-40"
            style={{
              background: `linear-gradient(135deg, ${getAccentColor()}, rgba(198, 88, 255, 0.8))`,
            }}
            whileHover={{ scale: message.trim() ? 1.05 : 1 }}
            whileTap={{ scale: message.trim() ? 0.95 : 1 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 2L9 11M18 2L12 18L9 11M18 2L2 8L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
