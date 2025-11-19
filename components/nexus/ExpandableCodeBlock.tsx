'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ExpandableCodeBlockProps {
  code: string;
  language: string;
  onCopy: (code: string) => void;
  previewLines?: number;
}

/**
 * ExpandableCodeBlock - Code block with preview/expand functionality
 * Shows first N lines by default, with option to expand to full code
 */
export function ExpandableCodeBlock({
  code,
  language,
  onCopy,
  previewLines = 10,
}: ExpandableCodeBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const lines = code.split('\n');
  const totalLines = lines.length;
  const shouldShowExpand = totalLines > previewLines;
  const displayCode = isExpanded ? code : lines.slice(0, previewLines).join('\n');

  const handleCopy = async () => {
    await onCopy(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-white/70 shadow-luminous bg-white/40 backdrop-blur-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-luminous-accent-cyan/20 via-luminous-accent-purple/20 to-luminous-accent-coral/20 px-5 py-3 border-b border-white/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-luminous-accent-cyan animate-pulse"></span>
          <span className="text-xs font-bold text-luminous-text-primary uppercase tracking-wider">
            {language}
          </span>
          {shouldShowExpand && !isExpanded && (
            <span className="px-2 py-0.5 rounded-full bg-white/60 text-luminous-text-tertiary text-xs font-bold">
              {totalLines} lines
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {shouldShowExpand && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1.5 text-xs rounded-lg font-bold bg-white/50 hover:bg-white/80 border border-white/70 text-luminous-text-primary hover:text-luminous-accent-purple transition-all shadow-sm"
            >
              {isExpanded ? '▲ Collapse' : `▼ Expand (${totalLines - previewLines} more)`}
            </motion.button>
          )}

          <motion.button
            onClick={handleCopy}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1.5 text-xs rounded-lg font-bold bg-white/50 hover:bg-white/80 border border-white/70 text-luminous-text-primary hover:text-luminous-accent-cyan transition-all shadow-sm"
          >
            {copied ? '✓ Copied!' : '📋 Copy'}
          </motion.button>
        </div>
      </div>

      {/* Code Display */}
      <div className="bg-[#1E1E1E] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={isExpanded ? 'expanded' : 'collapsed'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-4"
          >
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              className="!m-0 !bg-transparent text-sm"
              customStyle={{
                margin: 0,
                padding: 0,
                background: 'transparent',
              }}
              showLineNumbers
            >
              {displayCode}
            </SyntaxHighlighter>
          </motion.div>
        </AnimatePresence>

        {/* Fade overlay when collapsed */}
        {shouldShowExpand && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#1E1E1E] to-transparent pointer-events-none" />
        )}
      </div>
    </div>
  );
}
