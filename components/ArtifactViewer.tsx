'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface ArtifactViewerProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
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

export function ArtifactViewer({ content, isOpen, onClose, title }: ArtifactViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleExport = (format: 'md' | 'txt') => {
    const blob = new Blob([editedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `artifact-${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(editedContent);
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-secondary">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <h2 className="font-serif font-semibold text-lg text-foreground">
                  {title || 'Document Workspace'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Edit/Preview Toggle */}
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded transition-colors',
                    isEditing
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-background-tertiary text-foreground-secondary border border-border hover:bg-background'
                  )}
                >
                  {isEditing ? '👁️ Preview' : '✏️ Edit'}
                </button>

                {/* Export Dropdown */}
                <div className="relative group">
                  <button className="px-3 py-1.5 text-sm rounded bg-background-tertiary text-foreground-secondary border border-border hover:bg-background transition-colors">
                    ↓ Export
                  </button>
                  <div className="absolute right-0 mt-2 w-40 bg-background border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <button
                      onClick={() => handleExport('md')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-secondary transition-colors text-foreground-secondary"
                    >
                      Markdown (.md)
                    </button>
                    <button
                      onClick={() => handleExport('txt')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-secondary transition-colors text-foreground-secondary"
                    >
                      Plain Text (.txt)
                    </button>
                    <button
                      onClick={handleCopyAll}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-secondary transition-colors text-foreground-secondary border-t border-border"
                    >
                      📋 Copy All
                    </button>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm rounded bg-background-tertiary text-foreground-secondary border border-border hover:bg-background hover:text-foreground transition-colors"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              {isEditing ? (
                // Edit Mode
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="w-full h-full p-8 bg-background text-foreground font-mono text-sm resize-none focus:outline-none"
                  spellCheck={false}
                />
              ) : (
                // Preview Mode
                <div className="h-full overflow-y-auto p-8">
                  <div className="max-w-4xl mx-auto">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Same components as Message.tsx for consistency
                        p: ({ children }) => (
                          <p className="mb-4 last:mb-0 leading-relaxed text-foreground-secondary">
                            {children}
                          </p>
                        ),
                        h1: ({ children }) => (
                          <h1 className="text-3xl font-serif font-bold text-foreground mb-4 mt-6 first:mt-0 pb-2 border-b border-border">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-2xl font-serif font-bold text-foreground mb-3 mt-5 first:mt-0">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-xl font-serif font-semibold text-foreground mb-2 mt-4 first:mt-0">
                            {children}
                          </h3>
                        ),
                        h4: ({ children }) => (
                          <h4 className="text-lg font-serif font-semibold text-foreground mb-2 mt-3 first:mt-0">
                            {children}
                          </h4>
                        ),
                        strong: ({ children }) => (
                          <strong className="text-foreground font-bold">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-foreground italic">{children}</em>
                        ),
                        code: ({ node, inline, className, children, ...props }: any) => {
                          const match = /language-(\w+)/.exec(className || '');
                          const language = match ? match[1] : '';
                          const codeString = String(children).replace(/\n$/, '');

                          return !inline && language ? (
                            <div className="my-4 rounded-lg overflow-hidden border border-border shadow-lg">
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
                                  padding: '1.5rem',
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
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-accent/40 pl-4 py-2 my-4 italic text-foreground-secondary bg-accent/5 rounded-r">
                            {children}
                          </blockquote>
                        ),
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
                          <tr className="border-b border-border last:border-0">{children}</tr>
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
                        hr: () => (
                          <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        ),
                        img: ({ src, alt }) => (
                          <img
                            src={src}
                            alt={alt || ''}
                            className="rounded-lg max-w-full h-auto my-4 border border-border shadow-sm"
                          />
                        ),
                      }}
                    >
                      {editedContent}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Footer - optional stats */}
            <div className="px-6 py-3 border-t border-border bg-background-secondary text-xs text-foreground-tertiary flex items-center justify-between">
              <div>
                {editedContent.split(/\s+/).length} words · {editedContent.length} characters
              </div>
              <div className="flex items-center gap-4">
                <kbd className="px-2 py-1 rounded bg-background border border-border font-mono">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
