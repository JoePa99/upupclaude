'use client';

import { Message as MessageType } from '@/types';
import { formatTime, getInitials, getAvatarColor, cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';
import { ArtifactViewer } from './ArtifactViewer';

interface MessageProps {
  message: MessageType;
  index: number;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="px-2 py-1 text-xs rounded bg-background-tertiary hover:bg-background border border-border text-foreground-tertiary hover:text-foreground transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export function Message({ message, index }: MessageProps) {
  const isAI = message.authorType === 'assistant';
  const author =
    message.authorType === 'human' ? message.author : message.author;
  const [isArtifactOpen, setIsArtifactOpen] = useState(false);

  return (
    <>
      <ArtifactViewer
        content={message.content}
        isOpen={isArtifactOpen}
        onClose={() => setIsArtifactOpen(false)}
        title={isAI && 'model' in author ? `${author.name} Response` : undefined}
      />

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

            {/* Expand button for AI messages */}
            {isAI && (
              <button
                onClick={() => setIsArtifactOpen(true)}
                className="text-xs text-foreground-tertiary hover:text-accent transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                title="Open in workspace"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                Expand
              </button>
            )}
          </div>

          {/* Message content */}
          <div
            className={cn(
              'text-foreground-secondary leading-relaxed',
              isAI && 'prose-custom max-w-none'
            )}
          >
            {isAI ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>
                  ),

                  // Headings
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-serif font-bold text-foreground mb-4 mt-6 first:mt-0 pb-2 border-b border-border">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-serif font-bold text-foreground mb-3 mt-5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-serif font-semibold text-foreground mb-2 mt-4 first:mt-0">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-base font-serif font-semibold text-foreground mb-2 mt-3 first:mt-0">
                      {children}
                    </h4>
                  ),

                  // Text formatting
                  strong: ({ children }) => (
                    <strong className="text-foreground font-bold">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-foreground italic">{children}</em>
                  ),

                  // Code blocks
                  code: ({ node, inline, className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const codeString = String(children).replace(/\n$/, '');

                    return !inline && language ? (
                      <div className="my-4 rounded-lg overflow-hidden border border-border shadow-lg group">
                        <div className="bg-background-secondary px-4 py-2 border-b border-border flex items-center justify-between">
                          <span className="text-xs font-mono text-foreground-tertiary uppercase tracking-wide">
                            {language}
                          </span>
                          <CopyButton code={codeString} />
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={language}
                          PreTag="div"
                          className="!m-0 !bg-background-tertiary text-sm"
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            background: 'transparent',
                          }}
                          showLineNumbers
                          {...props}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code
                        className="px-1.5 py-0.5 rounded bg-background-secondary text-accent font-mono text-sm border border-border"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },

                  // Lists
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-6 space-y-2 mb-4 text-foreground-secondary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-6 space-y-2 mb-4 text-foreground-secondary">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),

                  // Blockquotes
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-accent/40 pl-4 py-2 my-4 italic text-foreground-secondary bg-accent/5 rounded-r">
                      {children}
                    </blockquote>
                  ),

                  // Links
                  a: ({ children, href }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors"
                    >
                      {children}
                    </a>
                  ),

                  // Tables
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto">
                      <table className="min-w-full border-collapse border border-border rounded-lg overflow-hidden">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-background-secondary">{children}</thead>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="border-b border-border last:border-0">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-r border-border last:border-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-sm text-foreground-secondary border-r border-border last:border-0">
                      {children}
                    </td>
                  ),

                  // Horizontal rule
                  hr: () => (
                    <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  ),

                  // Images
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt || 'Generated Image'}
                      className="rounded-lg max-w-full h-auto my-4 border border-border shadow-sm"
                      onError={(e) => {
                        console.error('Image failed to load:', src?.substring(0, 100));
                        e.currentTarget.style.display = 'none';
                      }}
                      loading="lazy"
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="leading-relaxed">{message.content}</p>
            )}
          </div>

          {/* AI model indicator (subtle glow effect) */}
          {isAI && (
            <div className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gradient-to-b from-ai via-ai/50 to-transparent animate-glow" />
          )}
        </div>
      </div>
    </motion.div>
    </>
  );
}
