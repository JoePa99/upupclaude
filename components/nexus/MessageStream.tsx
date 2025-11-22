'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message as MessageType } from '@/types';
import { ExpandableCodeBlock } from './ExpandableCodeBlock';
import { TableOfContents } from './TableOfContents';
import { CollapsibleSection } from './CollapsibleSection';
import { shouldUseProgressiveDisclosure, splitIntoSections } from '@/lib/messageParser';

interface MessageStreamProps {
  messages: MessageType[];
  onArtifactOpen?: (message: MessageType) => void;
}

/**
 * NEXUS Message Stream - Clean, lightweight conversation flow
 * Substantial outputs (code blocks, tables) are placed in structured containers
 * that users can interact with independently
 */
export function MessageStream({ messages, onArtifactOpen }: MessageStreamProps) {
  return (
    <div className="px-8 py-8 space-y-6">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <MessageCard
            key={message.id}
            message={message}
            index={index}
            onArtifactOpen={onArtifactOpen}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface MessageCardProps {
  message: MessageType;
  index: number;
  onArtifactOpen?: (message: MessageType) => void;
}

function MessageCard({ message, index, onArtifactOpen }: MessageCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const isAI = message.authorType === 'assistant';

  // Extract metadata for artifacts
  const hasArtifact = message.metadata?.artifact_type;
  const reasoning = message.metadata?.reasoning;

  // Copy to clipboard with markdown or plain text
  const handleCopy = (format: 'markdown' | 'plaintext') => {
    const textToCopy = format === 'markdown'
      ? message.content
      : message.content.replace(/[#*`_~\[\]()]/g, '').replace(/\n{3,}/g, '\n\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as file
  const handleDownload = (format: 'md' | 'txt') => {
    const content = format === 'md'
      ? message.content
      : message.content.replace(/[#*`_~\[\]()]/g, '').replace(/\n{3,}/g, '\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${message.author.name.replace(/\s+/g, '-')}-${new Date(message.timestamp).toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Reusable markdown components for both progressive and standard rendering
  const getMarkdownComponents = () => ({
    // Paragraphs - using primary for better readability
    p: ({ children }: any) => (
      <p className="mb-4 last:mb-0 leading-relaxed text-luminous-text-primary">
        {children}
      </p>
    ),

    // Headings with Luminous Glass styling and auto-generated IDs
    h1: ({ children }: any) => {
      const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
      return (
        <h1 id={id} className="text-3xl font-extrabold bg-gradient-to-r from-luminous-accent-cyan via-luminous-accent-purple to-luminous-accent-coral bg-clip-text text-transparent mb-4 mt-6 first:mt-0 pb-3 border-b border-luminous-text-tertiary/20 scroll-mt-24">
          {children}
        </h1>
      );
    },
    h2: ({ children }: any) => {
      const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
      return (
        <h2 id={id} className="text-2xl font-bold text-luminous-text-primary mb-3 mt-5 first:mt-0 scroll-mt-24">
          {children}
        </h2>
      );
    },
    h3: ({ children }: any) => {
      const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
      return (
        <h3 id={id} className="text-xl font-semibold text-luminous-text-primary mb-2 mt-4 first:mt-0 scroll-mt-24">
          {children}
        </h3>
      );
    },
    h4: ({ children }: any) => {
      const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
      return (
        <h4 id={id} className="text-lg font-semibold text-luminous-text-secondary mb-2 mt-3 first:mt-0 scroll-mt-24">
          {children}
        </h4>
      );
    },

    // Text formatting
    strong: ({ children }: any) => (
      <strong className="text-luminous-text-primary font-extrabold">
        {children}
      </strong>
    ),
    em: ({ children }: any) => (
      <em className="text-luminous-text-primary italic opacity-90">{children}</em>
    ),

    // Code blocks with syntax highlighting and expandable UI
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      const codeString = String(children).replace(/\n$/, '');

      return !inline && language ? (
        <ExpandableCodeBlock
          code={codeString}
          language={language}
          onCopy={async (code) => {
            await navigator.clipboard.writeText(code);
          }}
          previewLines={10}
        />
      ) : (
        <code
          className="px-2 py-0.5 rounded-lg bg-luminous-accent-cyan/10 text-luminous-accent-cyan font-mono text-sm border border-luminous-accent-cyan/30 font-semibold"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Lists with custom styling
    ul: ({ children }: any) => (
      <ul className="ml-6 space-y-2 mb-4 text-luminous-text-primary">
        {children}
      </ul>
    ),
    ol: ({ children }: any) => (
      <ol className="ml-6 space-y-2 mb-4 text-luminous-text-primary">
        {children}
      </ol>
    ),
    li: ({ children, ordered }: any) => (
      <li className="leading-relaxed flex items-start gap-3">
        {!ordered && (
          <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-br from-luminous-accent-cyan to-luminous-accent-purple mt-2 flex-shrink-0"></span>
        )}
        <span className="flex-1">{children}</span>
      </li>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-luminous-accent-purple/60 pl-5 py-3 my-4 italic text-luminous-text-secondary bg-luminous-accent-purple/5 rounded-r-2xl backdrop-blur-sm">
        {children}
      </blockquote>
    ),

    // Links with hover glow
    a: ({ children, href }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-luminous-accent-cyan hover:text-luminous-accent-purple font-semibold underline underline-offset-2 decoration-luminous-accent-cyan/40 hover:decoration-luminous-accent-purple/60 transition-all duration-300"
      >
        {children}
      </a>
    ),

    // Tables with Luminous Glass styling
    table: ({ children }: any) => (
      <div className="my-4 overflow-x-auto rounded-2xl border border-white/70 shadow-luminous">
        <table className="min-w-full border-collapse bg-white/40 backdrop-blur-xl">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-gradient-to-r from-luminous-accent-cyan/20 via-luminous-accent-purple/20 to-luminous-accent-coral/20">
        {children}
      </thead>
    ),
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => (
      <tr className="border-b border-white/30 last:border-0 hover:bg-white/30 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: any) => (
      <th className="px-5 py-3 text-left text-sm font-bold text-luminous-text-primary border-r border-white/30 last:border-0">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-5 py-3 text-sm text-luminous-text-secondary border-r border-white/20 last:border-0">
        {children}
      </td>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-luminous-accent-cyan/50 through-luminous-accent-purple/50 to-transparent" />
    ),

    // Images
    img: ({ src, alt }: any) => (
      <img
        src={src}
        alt={alt || 'Image'}
        className="rounded-2xl max-w-full h-auto my-4 border-2 border-white/70 shadow-super-glass"
      />
    ),
  });

  if (!isAI) {
    // Human Message - Minimal glass card
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ delay: index * 0.05 }}
        className="flex justify-end"
      >
        <div className="max-w-2xl">
          <div className="flex items-start gap-3 justify-end mb-2" style={{ userSelect: 'none' }}>
            <div className="text-right">
              <span className="text-sm font-semibold text-luminous-text-primary">
                {message.author.name}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-luminous-accent-cyan flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {message.author.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div
            className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-3xl px-5 py-4 shadow-md"
            style={{ userSelect: 'text', cursor: 'text' }}
          >
            <p className="text-luminous-text-primary font-medium">{message.content}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // AI Message - Super-Glass card with enhanced styling
  const colorMap: Record<string, string> = {
    cyan: '#56E3FF',
    purple: '#C658FF',
    coral: '#FF5A5F',
    yellow: '#FFC107',
  };

  // Type guard to check if author is Assistant
  const isAssistant = (author: any): author is import('@/types').Assistant => {
    return 'colorTheme' in author;
  };

  const agentColor = isAssistant(message.author)
    ? colorMap[message.author.colorTheme || 'purple'] || colorMap.purple
    : colorMap.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="flex justify-start"
    >
      <div className="max-w-3xl w-full">
        {/* Agent Header */}
        <div className="flex items-start gap-3 mb-3 justify-between" style={{ userSelect: 'none' }}>
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-base flex-shrink-0 shadow-luminous"
              style={{ backgroundColor: agentColor }}
            >
              {message.author.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-luminous-text-primary">
                  {message.author.name}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: agentColor }}
                >
                  {message.author.role}
                </span>
              </div>
              <span className="text-xs text-luminous-text-tertiary font-medium">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white/80 backdrop-blur-md border border-white/70 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            title="Copy or download this message"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-luminous-text-secondary">
              <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 10V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span className="text-xs font-bold text-luminous-text-secondary">Export</span>
          </button>
        </div>

        {/* Super-Glass Card */}
        <div
          className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-luminous shadow-super-glass overflow-hidden"
          style={{ userSelect: 'text', cursor: 'text' }}
        >
          {/* Reasoning Section (Collapsible) */}
          {reasoning && (
            <div className="border-b border-luminous-text-tertiary/10">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-white/40 transition-colors"
                style={{ userSelect: 'none', cursor: 'pointer' }}
              >
                <span className="text-sm font-bold text-luminous-text-secondary">
                  💭 Reasoning Process
                </span>
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  animate={{ rotate: showReasoning ? 180 : 0 }}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </button>

              <AnimatePresence>
                {showReasoning && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-4 overflow-hidden"
                  >
                    <div className="text-sm text-luminous-text-secondary space-y-2 font-medium">
                      {reasoning.split('\n').map((step: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-luminous-accent-purple font-bold">→</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Main Content */}
          <div className="px-6 py-5" data-message-id={message.id}>
            {/* Progressive Disclosure: For long messages with multiple sections */}
            {shouldUseProgressiveDisclosure(message.content) ? (
              <>
                {splitIntoSections(message.content).map((section, idx) => (
                  <CollapsibleSection
                    key={`${message.id}-section-${idx}`}
                    title={section.title}
                    defaultOpen={idx === 0} // First section open by default
                    variant="card"
                    badge={idx === 0 ? undefined : '📋'}
                  >
                    <div className="prose prose-sm max-w-none text-luminous-text-primary">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={getMarkdownComponents()}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  </CollapsibleSection>
                ))}
              </>
            ) : (
              <>
                {/* Table of Contents (auto-generates for messages with 3+ headings) */}
                <TableOfContents messageId={message.id} minHeadings={3} />

                <div className="prose prose-sm max-w-none text-luminous-text-primary">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={getMarkdownComponents()}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {hasArtifact && (
            <div className="px-6 pb-5">
              <motion.button
                onClick={() => onArtifactOpen?.(message)}
                className="px-5 py-3 rounded-2xl font-bold text-white text-sm flex items-center gap-2 shadow-luminous"
                style={{
                  background: `linear-gradient(135deg, ${agentColor}, rgba(198, 88, 255, 0.8))`,
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 9V14H2V9M11 5L8 2M8 2L5 5M8 2V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View {message.metadata?.artifact_type === 'linkedin_post' ? 'Post' : 'Report'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExportModal(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-white/90 backdrop-blur-2xl border-2 border-white/90 rounded-3xl shadow-super-glass z-50 overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-luminous-text-tertiary/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-extrabold text-luminous-text-primary">
                      Export Message
                    </h3>
                    <p className="text-sm text-luminous-text-tertiary mt-1">
                      {message.author.name} • {new Date(message.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/80 border border-white/70 flex items-center justify-center transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* Modal Content - Full Message */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <div className="prose prose-sm max-w-none text-luminous-text-primary">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={getMarkdownComponents()}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>

                {/* Modal Footer - Action Buttons */}
                <div className="px-6 py-4 border-t border-luminous-text-tertiary/10 bg-white/50 flex items-center gap-3">
                  <button
                    onClick={() => handleCopy('markdown')}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-luminous-accent-cyan to-luminous-accent-purple text-white font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8L6 11L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="2"/>
                          <path d="M11 3H3C2.44772 3 2 3.44772 2 4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Copy Markdown
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopy('plaintext')}
                    className="flex-1 px-4 py-3 rounded-xl bg-white border-2 border-luminous-accent-purple text-luminous-accent-purple font-bold text-sm hover:bg-luminous-accent-purple hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="2"/>
                      <path d="M11 3H3C2.44772 3 2 3.44772 2 4V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Copy Plain Text
                  </button>

                  <button
                    onClick={() => handleDownload('md')}
                    className="px-4 py-3 rounded-xl bg-white border-2 border-luminous-accent-cyan text-luminous-accent-cyan font-bold text-sm hover:bg-luminous-accent-cyan hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 10V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    .md
                  </button>

                  <button
                    onClick={() => handleDownload('txt')}
                    className="px-4 py-3 rounded-xl bg-white border-2 border-luminous-accent-coral text-luminous-accent-coral font-bold text-sm hover:bg-luminous-accent-coral hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 10V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    .txt
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
