'use client';

import { useState, useEffect, useRef } from 'react';

interface SelectionPosition {
  x: number;
  y: number;
}

/**
 * Hook to detect text selection and provide selection position
 * Returns: selectedText, position, and clear function
 */
export function useTextSelection<T extends HTMLElement = HTMLElement>(containerRef: React.RefObject<T | null>) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<SelectionPosition | null>(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      // Check if selection is within our container
      if (selection && text && containerRef.current) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Verify selection is within container
        const isInContainer = containerRef.current.contains(range.commonAncestorContainer);

        if (isInContainer && rect.width > 0 && rect.height > 0) {
          setSelectedText(text);
          setPosition({
            x: rect.left + rect.width / 2, // Center of selection
            y: rect.top,
          });
        } else {
          setSelectedText('');
          setPosition(null);
        }
      } else {
        setSelectedText('');
        setPosition(null);
      }
    };

    // Listen for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    // Also listen for mouse up (for immediate feedback)
    const handleMouseUp = () => {
      setTimeout(handleSelectionChange, 10); // Small delay for selection to complete
    };
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef]);

  const clearSelection = () => {
    setSelectedText('');
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  return { selectedText, position, clearSelection };
}
