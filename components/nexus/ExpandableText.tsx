'use client';

import { motion } from 'framer-motion';
import { useState, ReactNode } from 'react';

interface ExpandableTextProps {
  children: ReactNode;
  maxLength?: number;
  previewLength?: number;
}

/**
 * ExpandableText - Show preview of long text with expand/collapse
 * Truncates text at character limit with smooth expand animation
 */
export function ExpandableText({
  children,
  maxLength = 300,
  previewLength = 250,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract text content from children
  const textContent = typeof children === 'string' ? children : '';
  const shouldTruncate = textContent.length > maxLength;

  if (!shouldTruncate) {
    return <>{children}</>;
  }

  const preview = textContent.slice(0, previewLength) + '...';

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 'auto' }}
        transition={{ duration: 0.2 }}
      >
        {isExpanded ? children : preview}
      </motion.div>

      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-2 text-xs font-bold text-luminous-accent-cyan hover:text-luminous-accent-purple transition-colors inline-flex items-center gap-1"
      >
        {isExpanded ? (
          <>
            <span>▲</span>
            <span>Show less</span>
          </>
        ) : (
          <>
            <span>▼</span>
            <span>Show more ({textContent.length - previewLength} more characters)</span>
          </>
        )}
      </motion.button>
    </div>
  );
}
