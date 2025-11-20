'use client';

import { useState, useEffect, useRef } from 'react';

interface SelectionPosition {
  x: number;
  y: number;
}

/**
 * Hook to detect text selection and provide selection position
 * Returns: selectedText, position, and clear function
 * FIXED: Only checks selection on mouseup, doesn't interfere with native selection
 */
export function useTextSelection<T extends HTMLElement = HTMLElement>(containerRef: React.RefObject<T | null>) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<SelectionPosition | null>(null);

  useEffect(() => {
    // Only check selection when mouse is released (not during drag)
    const handleMouseUp = () => {
      // Wait a tiny bit for selection to finalize
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim() || '';

        // Check if selection is within our container
        if (selection && text && containerRef.current && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const isInContainer = containerRef.current.contains(range.commonAncestorContainer);

          if (isInContainer) {
            const rect = range.getBoundingClientRect();

            // Only show if rect is valid and visible on screen
            if (rect.width > 0 && rect.height > 0 && rect.top > 0) {
              const toolbarPosition = {
                x: rect.left + rect.width / 2,
                y: rect.top + window.scrollY, // Account for scroll
              };
              setSelectedText(text);
              setPosition(toolbarPosition);
              return;
            }
          }
        }

        // Clear if no valid selection
        setSelectedText('');
        setPosition(null);
      }, 50);
    };

    // Clear selection when clicking (starting new selection)
    const handleMouseDown = () => {
      setSelectedText('');
      setPosition(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [containerRef]);

  const clearSelection = () => {
    setSelectedText('');
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  return { selectedText, position, clearSelection };
}
