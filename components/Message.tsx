'use client';

import { Message as MessageType } from '@/types';
import { formatTime, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface MessageProps {
  message: MessageType;
  index: number;
}

export function Message({ message, index }: MessageProps) {
  const isAI = message.authorType === 'assistant';
  const author =
    message.authorType === 'human' ? message.author : message.author;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        'group relative py-4 px-6 hover:bg-background-secondary/50 transition-colors',
        isAI && 'bg-ai-glow border-l-2 border-ai'
      )}
    >
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold',
              isAI
                ? 'bg-ai/20 text-ai border border-ai/30'
                : getAvatarColor(author.id) + ' text-white'
            )}
          >
            {isAI ? '◆' : getInitials(author.name)}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-baseline gap-3 mb-1">
            <span
              className={cn(
                'font-serif font-semibold text-base',
                isAI ? 'text-ai' : 'text-foreground'
              )}
            >
              {author.name}
            </span>

            {isAI && 'model' in author && (
              <span className="text-xs text-foreground-tertiary font-mono">
                {author.model.name}
              </span>
            )}

            <span className="text-xs text-foreground-tertiary">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message content */}
          <div
            className={cn(
              'text-foreground-secondary leading-relaxed',
              isAI && 'prose-custom'
            )}
          >
            {isAI ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                  strong: ({ children }) => (
                    <strong className="text-foreground font-semibold">
                      {children}
                    </strong>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1 mb-3">
                      {children}
                    </ul>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground-secondary">{children}</li>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-xl font-serif font-semibold text-foreground mb-3 mt-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-serif font-semibold text-foreground mb-2 mt-3">
                      {children}
                    </h2>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p>{message.content}</p>
            )}
          </div>

          {/* AI model indicator (subtle glow effect) */}
          {isAI && (
            <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-ai via-ai/50 to-transparent animate-glow" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
