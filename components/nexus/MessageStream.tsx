'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message as MessageType } from '@/types';

interface MessageStreamProps {
  messages: MessageType[];
  onArtifactOpen?: (message: MessageType) => void;
}

/**
 * NEXUS Message Stream - Center chat with glass cards
 * Human: Minimal text on glass
 * AI Agent: Super-Glass cards with collapsible reasoning + action buttons
 */
export function MessageStream({ messages, onArtifactOpen }: MessageStreamProps) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
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
          <div className="flex items-start gap-3 justify-end mb-2">
            <div className="text-right">
              <span className="text-sm font-semibold text-luminous-text-primary">
                {message.author.name}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-luminous-accent-cyan flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {message.author.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <motion.div
            className="bg-white/50 backdrop-blur-xl border border-white/70 rounded-3xl px-5 py-4 shadow-md"
            whileHover={{ scale: 1.005, y: -1 }}
          >
            <p className="text-luminous-text-primary font-medium">{message.content}</p>
          </motion.div>
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
        <div className="flex items-start gap-3 mb-3">
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
        <motion.div
          className="bg-white/80 backdrop-blur-2xl border border-white/90 rounded-luminous shadow-super-glass overflow-hidden"
          whileHover={{ scale: 1.002, y: -2 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Reasoning Section (Collapsible) */}
          {reasoning && (
            <div className="border-b border-luminous-text-tertiary/10">
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-white/40 transition-colors"
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
          <div className="px-6 py-5">
            <div className="prose prose-sm max-w-none text-luminous-text-primary">
              <ReactMarkdown>{message.content}</ReactMarkdown>
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
        </motion.div>
      </div>
    </motion.div>
  );
}
