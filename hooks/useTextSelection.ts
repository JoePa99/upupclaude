'use client';

import { useState, useEffect, useRef } from 'react';

interface SelectionPosition {
  x: number;
  y: number;
}

/**
 * Hook to detect text selection and provide selection position
 * Uses CSS Custom Highlight API to maintain visual highlight independent of browser selection
 */
export function useTextSelection<T extends HTMLElement = HTMLElement>(containerRef: React.RefObject<T | null>) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<SelectionPosition | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      // Capture selection IMMEDIATELY
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
              y: rect.top + window.scrollY,
            };

            // Save the range
            savedRangeRef.current = range.cloneRange();

            // Create custom highlight using CSS Highlight API (if supported)
            if ('highlights' in CSS) {
              try {
                const highlight = new Highlight(savedRangeRef.current);
                (CSS as any).highlights.set('selection-highlight', highlight);
              } catch (e) {
                console.warn('Highlight API failed:', e);
              }
            }

            setSelectedText(text);
            setPosition(toolbarPosition);
            return;
          }
        }
      }

      // Clear if no valid selection
      if (!savedRangeRef.current) {
        setSelectedText('');
        setPosition(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Don't clear if clicking within the toolbar area
      const target = e.target as HTMLElement;
      if (target.closest('[data-selection-toolbar]')) {
        return;
      }

      setSelectedText('');
      setPosition(null);
      savedRangeRef.current = null;

      // Clear custom highlight
      if ('highlights' in CSS) {
        try {
          (CSS as any).highlights.delete('selection-highlight');
        } catch (e) {
          // Ignore
        }
      }
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
    savedRangeRef.current = null;

    // Clear custom highlight
    if ('highlights' in CSS) {
      try {
        (CSS as any).highlights.delete('selection-highlight');
      } catch (e) {
        // Ignore
      }
    }

    window.getSelection()?.removeAllRanges();
  };

  const restoreSelection = () => {
    // Not needed with CSS Highlight API, but keep for compatibility
    if (savedRangeRef.current) {
      try {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(savedRangeRef.current);
      } catch (e) {
        console.warn('Failed to restore selection:', e);
      }
    }
  };

  return { selectedText, position, clearSelection, restoreSelection };
}

