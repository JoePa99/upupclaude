'use client';

import { useState, KeyboardEvent } from 'react';
import { Assistant } from '@/types';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  assistants: Assistant[];
  onSendMessage: (content: string, mentions: string[]) => void;
}

export function ChatInput({ assistants, onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }

    // Show mention dropdown when @ is typed
    if (e.key === '@') {
      setShowMentions(true);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Extract mentions
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(message)) !== null) {
      const mentionName = match[1].toLowerCase().replace(/_/g, ' ');
      const assistant = assistants.find((a) =>
        a.name.toLowerCase().includes(mentionName)
      );
      if (assistant) {
        mentions.push(assistant.id);
      }
    }

    onSendMessage(message, mentions);
    setMessage('');
    setShowMentions(false);
  };

  const insertMention = (assistantName: string) => {
    const formattedName = assistantName.toLowerCase().replace(/ /g, '_');
    setMessage((prev) => prev + `@${formattedName} `);
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
              {assistants.map((assistant) => (
                <button
                  key={assistant.id}
                  onClick={() => insertMention(assistant.name)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-background-secondary transition-colors text-left"
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message #product-launch (use @assistant_name to mention)"
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
