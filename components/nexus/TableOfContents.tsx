'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  messageId: string;
  minHeadings?: number;
}

/**
 * TableOfContents - Auto-generated navigation for messages with multiple headings
 * Smooth scrolls to sections when clicked
 */
export function TableOfContents({ messageId, minHeadings = 3 }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Find all headings in the message
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    const headings = messageElement.querySelectorAll('h1, h2, h3, h4');
    if (headings.length < minHeadings) return;

    const tocItems: TocItem[] = Array.from(headings).map((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent || '';
      const id = heading.id || `heading-${messageId}-${index}`;

      // Add ID if it doesn't exist
      if (!heading.id) {
        heading.id = id;
      }

      return { id, text, level };
    });

    setItems(tocItems);

    // Set up intersection observer for active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -80% 0px' }
    );

    headings.forEach((heading) => observer.observe(heading));

    return () => observer.disconnect();
  }, [messageId, minHeadings]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (items.length < minHeadings) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-luminous-accent-cyan/10 via-luminous-accent-purple/10 to-luminous-accent-coral/10 border border-white/70 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">📑</span>
        <h3 className="text-sm font-extrabold text-luminous-text-primary">
          Table of Contents
        </h3>
      </div>

      <nav className="space-y-1">
        {items.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => handleClick(item.id)}
            whileHover={{ x: 4 }}
            className={`
              w-full text-left py-2 px-3 rounded-lg text-sm transition-all
              ${item.level === 1 ? 'font-bold' : item.level === 2 ? 'font-semibold pl-5' : 'pl-8'}
              ${
                activeId === item.id
                  ? 'bg-luminous-accent-cyan/20 text-luminous-accent-cyan font-bold'
                  : 'text-luminous-text-secondary hover:bg-white/40 hover:text-luminous-text-primary'
              }
            `}
          >
            {item.text}
          </motion.button>
        ))}
      </nav>
    </motion.div>
  );
}
