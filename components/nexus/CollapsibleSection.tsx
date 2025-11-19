'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: string;
  badge?: string | number;
  variant?: 'default' | 'subtle' | 'card';
}

/**
 * CollapsibleSection - Expandable/collapsible content container
 * Perfect for organizing long-form content with progressive disclosure
 */
export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  icon,
  badge,
  variant = 'default',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variants = {
    default: {
      button: 'w-full px-5 py-3 flex items-center justify-between hover:bg-white/40 transition-colors rounded-xl',
      container: 'border border-white/70 rounded-2xl overflow-hidden bg-white/40 backdrop-blur-xl',
      content: 'px-5 pb-4',
    },
    subtle: {
      button: 'w-full py-2 flex items-center justify-between hover:bg-white/20 transition-colors',
      container: '',
      content: 'pt-2',
    },
    card: {
      button: 'w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-luminous-accent-cyan/10 hover:to-luminous-accent-purple/10 transition-all rounded-2xl',
      container: 'border-2 border-white/90 rounded-2xl overflow-hidden bg-white/60 backdrop-blur-2xl shadow-luminous',
      content: 'px-6 pb-5',
    },
  };

  const style = variants[variant];

  return (
    <div className={style.container}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={style.button}
        whileHover={{ scale: variant === 'subtle' ? 1 : 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <span className="text-sm font-bold text-luminous-text-primary">
            {title}
          </span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-luminous-accent-cyan/20 text-luminous-accent-cyan text-xs font-extrabold">
              {badge}
            </span>
          )}
        </div>

        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-luminous-text-secondary"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={style.content}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
