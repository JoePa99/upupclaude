'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message as MessageType } from '@/types';
import { SelectionHighlightOverlay } from './SelectionHighlightOverlay';
import { SelectionToolbar } from './SelectionToolbar';
import { useTextSelection } from '@/hooks/useTextSelection';
import { usePinStore } from '@/stores/pinStore';
import { useArtifactStore } from '@/stores/artifactStore';
import { ExpandableCodeBlock } from './ExpandableCodeBlock';
import { TableOfContents } from './TableOfContents';

interface MessageStreamProps {
  messages: MessageType[];
  onArtifactOpen?: (message: MessageType) => void;
  currentUserId?: string;
}

/**
 * Copy button for code blocks with feedback animation
 */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs rounded-lg font-bold bg-white/50 hover:bg-white/80 border border-white/70 text-luminous-text-primary hover:text-luminous-accent-cyan transition-all shadow-sm"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {copied ? '✓ Copied!' : '📋 Copy'}
    </motion.button>
  );
}

/**
 * NEXUS Message Stream - Center chat with glass cards
 * Human: Minimal text on glass
 * AI Agent: Super-Glass cards with collapsible reasoning + action buttons
 * Now with text selection plus pinning and artifact drafting!
 */
export function MessageStream({ messages, onArtifactOpen, currentUserId }: MessageStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedText, position, highlightRects, clearSelection, restoreSelection } = useTextSelection(containerRef);
  const { addPin, openPinboard } = usePinStore();
  const { addArtifact, openPanel } = useArtifactStore();
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  const handleCreateArtifact = (text: string) => {
    const fallbackMessageId = currentMessageId || messages[messages.length - 1]?.id;
    const title = text.split('\n').find((line) => line.trim().length > 0)?.slice(0, 80) || 'New Artifact';

    addArtifact({
      content: text,
      title,
      sourceMessageId: fallbackMessageId,
    });

    clearSelection();
    openPanel();
  };

  const handlePin = async (text: string) => {
    console.log('📌 Pin clicked!', { text, currentMessageId, currentUserId });

    if (!currentUserId) {
      console.error('❌ No user ID available');
      return;
    }

    if (!currentMessageId) {
      console.error('❌ No message ID - user may not have hovered over message');
      const fallbackMessageId = messages[messages.length - 1]?.id;
      if (!fallbackMessageId) {
        console.error('❌ No messages available');
        return;
      }
      setCurrentMessageId(fallbackMessageId);
      console.log('⚠️ Using fallback message ID:', fallbackMessageId);
    }

    try {
      await addPin({
        user_id: currentUserId,
        message_id: currentMessageId || messages[messages.length - 1]?.id,
        content: text,
        content_type: 'text',
        collection: 'Quick Pins',
      });
      console.log('✅ Pin created successfully!');
      clearSelection();
      openPinboard();
    } catch (error) {
      console.error('❌ Error creating pin:', error);
    }
  };

  const handleAskFollowUp = (text: string) => {
    console.log('💬 Ask follow-up clicked:', text);
    alert(`Ask follow-up feature coming soon!\n\nSelected text: "${text}"`);
    clearSelection();
  };

  const handleCopy = async (text: string) => {
    console.log('📋 Copy clicked:', text);
    try {
      await navigator.clipboard.writeText(text);
      console.log('✅ Copied to clipboard!');
    } catch (error) {
      console.error('❌ Failed to copy:', error);
      alert('Failed to copy to clipboard. Please try again.');
    }
  };

  const handleEdit = (text: string) => {
    console.log('✏️ Edit clicked:', text);
    handleCreateArtifact(text);
  };

  return (
    <div ref={containerRef} className="px-8 py-8 space-y-6">
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <MessageCard
            key={message.id}
            message={message}
            index={index}
            onArtifactOpen={onArtifactOpen}
            onMessageInteract={() => setCurrentMessageId(message.id)}
          />
        ))}
      </AnimatePresence>

      <SelectionHighlightOverlay rects={highlightRects} />

      {/* Selection Toolbar */}
      <SelectionToolbar
        selectedText={selectedText}
        position={position}
        onPin={handlePin}
        onCreateArtifact={handleCreateArtifact}
        onAskFollowUp={handleAskFollowUp}
        onCopy={handleCopy}
        onEdit={handleEdit}
        onRestoreSelection={restoreSelection}
      />
    </div>
  );
}

interface MessageCardProps {
  message: MessageType;
  index: number;
  onArtifactOpen?: (message: MessageType) => void;
  onMessageInteract?: () => void;
}

function MessageCard({ message, index, onArtifactOpen, onMessageInteract }: MessageCardProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isAI = message.authorType === 'assistant';

  // Extract metadata for artifacts
  const hasArtifact = message.metadata?.artifact_type;
  const reasoning = message.metadata?.reasoning;

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
      onMouseEnter={onMessageInteract}
    >
      <div className="max-w-3xl w-full">
        {/* Agent Header */}
        <div className="flex items-start gap-3 mb-3" style={{ userSelect: 'none' }}>
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
            {/* Table of Contents (auto-generates for messages with 3+ headings) */}
            <TableOfContents messageId={message.id} minHeadings={3} />

            <div className="prose prose-sm max-w-none text-luminous-text-primary">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0 leading-relaxed text-luminous-text-primary">
                      {children}
                    </p>
                  ),

                  // Headings with Luminous Glass styling and auto-generated IDs
                  h1: ({ children }) => {
                    const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
                    return (
                      <h1 id={id} className="text-3xl font-extrabold bg-gradient-to-r from-luminous-accent-cyan via-luminous-accent-purple to-luminous-accent-coral bg-clip-text text-transparent mb-4 mt-6 first:mt-0 pb-3 border-b border-luminous-text-tertiary/20 scroll-mt-24">
                        {children}
                      </h1>
                    );
                  },
                  h2: ({ children }) => {
                    const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
                    return (
                      <h2 id={id} className="text-2xl font-bold text-luminous-text-primary mb-3 mt-5 first:mt-0 scroll-mt-24">
                        {children}
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
                    return (
                      <h3 id={id} className="text-xl font-semibold text-luminous-text-primary mb-2 mt-4 first:mt-0 scroll-mt-24">
                        {children}
                      </h3>
                    );
                  },
                  h4: ({ children }) => {
                    const id = `heading-${message.id}-${String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`;
                    return (
                      <h4 id={id} className="text-lg font-semibold text-luminous-text-secondary mb-2 mt-3 first:mt-0 scroll-mt-24">
                        {children}
                      </h4>
                    );
                  },

                  // Text formatting
                  strong: ({ children }) => (
                    <strong className="text-luminous-text-primary font-extrabold">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="text-luminous-text-secondary italic">{children}</em>
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
                  ul: ({ children }) => (
                    <ul className="ml-6 space-y-2 mb-4 text-luminous-text-primary">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
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
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-luminous-accent-purple/60 pl-5 py-3 my-4 italic text-luminous-text-secondary bg-luminous-accent-purple/5 rounded-r-2xl backdrop-blur-sm">
                      {children}
                    </blockquote>
                  ),

                  // Links with hover glow
                  a: ({ children, href }) => (
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
                  table: ({ children }) => (
                    <div className="my-4 overflow-x-auto rounded-2xl border border-white/70 shadow-luminous">
                      <table className="min-w-full border-collapse bg-white/40 backdrop-blur-xl">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gradient-to-r from-luminous-accent-cyan/20 via-luminous-accent-purple/20 to-luminous-accent-coral/20">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => <tbody>{children}</tbody>,
                  tr: ({ children }) => (
                    <tr className="border-b border-white/30 last:border-0 hover:bg-white/30 transition-colors">
                      {children}
                    </tr>
                  ),
                  th: ({ children }) => (
                    <th className="px-5 py-3 text-left text-sm font-bold text-luminous-text-primary border-r border-white/30 last:border-0">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-5 py-3 text-sm text-luminous-text-secondary border-r border-white/20 last:border-0">
                      {children}
                    </td>
                  ),

                  // Horizontal rule
                  hr: () => (
                    <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-luminous-accent-cyan/50 through-luminous-accent-purple/50 to-transparent" />
                  ),

                  // Images
                  img: ({ src, alt }) => (
                    <img
                      src={src}
                      alt={alt || 'Image'}
                      className="rounded-2xl max-w-full h-auto my-4 border-2 border-white/70 shadow-super-glass"
                    />
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
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
      </div>
    </motion.div>
  );
}
