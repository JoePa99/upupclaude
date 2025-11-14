'use client';

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Assistant } from '@/types';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  assistants: Assistant[];
  channelName: string;
  onSendMessage: (content: string, mentions: string[]) => void;
}

export function ChatInput({ assistants, channelName, onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset selected index when dropdown opens
  useEffect(() => {
    if (showMentions) {
      setSelectedIndex(0);
    }
  }, [showMentions]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle keyboard navigation in mention dropdown
    if (showMentions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % assistants.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + assistants.length) % assistants.length);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(assistants[selectedIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Show mention dropdown when @ is typed (and prevent default to avoid double @)
    if (e.key === '@' || (e.key === '2' && e.shiftKey)) {
      e.preventDefault();
      setMessage((prev) => prev + '@');
      setShowMentions(true);
    }
  };

  const handleSend = () => {
    console.log('=== ChatInput handleSend called ===');
    console.log('Message:', message);
    console.log('Message trimmed:', message.trim());
    console.log('Available assistants:', assistants);

    if (!message.trim()) {
      console.log('Message is empty, returning early');
      return;
    }

    // Extract mentions - match @word pattern
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const mentions: string[] = [];
    let match;

    console.log('Starting mention detection...');
    console.log('Testing regex on message:', message);

    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionText = match[1].toLowerCase(); // e.g., "sales_assistant"
      console.log('✓ Found mention text:', mentionText);

      // Try to match against assistant names (converted to slug format)
      const assistant = assistants.find((a) => {
        const assistantSlug = a.name.toLowerCase().replace(/\s+/g, '_');
        console.log('  Comparing', mentionText, 'with', assistantSlug, 'from assistant:', a.name);
        return assistantSlug === mentionText || a.name.toLowerCase().includes(mentionText);
      });

      if (assistant) {
        console.log('✓ Matched assistant:', assistant.name, 'ID:', assistant.id);
        mentions.push(assistant.id);
      } else {
        console.log('✗ No assistant found for mention:', mentionText);
      }
    }

    console.log('=== Final mentions array:', mentions, '===');

    onSendMessage(message, mentions);
    setMessage('');
    setShowMentions(false);
  };

  const insertMention = (assistantName: string) => {
    const formattedName = assistantName.toLowerCase().replace(/\s+/g, '_');
    setMessage((prev) => {
      // If the last character is @, replace it with the full mention
      // Otherwise just append the mention
      if (prev.endsWith('@')) {
        return prev.slice(0, -1) + `@${formattedName} `;
      }
      return prev + `@${formattedName} `;
    });
    setShowMentions(false);
  };

  return (
    <div className="border-t border-border bg-background-secondary p-4">
      <div className="relative">
        {/* Mention dropdown */}
        {showMentions && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-background-tertiary border border-border rounded-lg shadow-xl overflow-hidden">
            <div className="p-2 border-b border-border">
              <p className="text-xs text-foreground-tertiary font-semibold uppercase tracking-wide">
                Mention Assistant
              </p>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {assistants.map((assistant, index) => (
                <button
                  key={assistant.id}
                  onClick={() => insertMention(assistant.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 transition-colors text-left",
                    index === selectedIndex
                      ? "bg-accent/20 border-l-2 border-accent"
                      : "hover:bg-background-secondary"
                  )}
                >
                  <div className="w-6 h-6 rounded bg-ai/20 border border-ai/30 flex items-center justify-center text-ai text-xs">
                    ◆
                  </div>
                  <div>
                    <div className="text-sm text-foreground">
                      {assistant.name}
                    </div>
                    <div className="text-xs text-foreground-tertiary">
                      {assistant.role}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message #${channelName} (use @assistant_name to mention)`}
            className={cn(
              'w-full bg-background border border-border rounded-lg px-4 py-3',
              'text-foreground placeholder:text-foreground-tertiary',
              'font-mono text-sm leading-relaxed',
              'resize-none focus:outline-none focus:border-accent transition-colors',
              'min-h-[60px] max-h-[200px]'
            )}
            rows={2}
          />

          {/* Send button */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <span className="text-xs text-foreground-tertiary">
              ⏎ to send · ⇧⏎ for new line
            </span>
            <button
              onClick={handleSend}
              disabled={!message.trim()}
              className={cn(
                'px-4 py-1.5 rounded-lg font-semibold text-sm transition-all',
                message.trim()
                  ? 'bg-accent text-background hover:bg-accent-hover'
                  : 'bg-background-tertiary text-foreground-tertiary cursor-not-allowed'
              )}
            >
              Send
            </button>
          </div>
        </div>

        {/* Helper text */}
        <div className="mt-2 flex items-center justify-between text-xs text-foreground-tertiary">
          <span>
            Type <kbd className="px-1.5 py-0.5 bg-background-tertiary rounded border border-border">@</kbd> to mention an assistant
          </span>
          <span>147 messages remaining this month</span>
        </div>
      </div>
    </div>
  );
}
