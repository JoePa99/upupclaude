'use client';

import { useState, useEffect, useRef } from 'react';

interface SelectionPosition {
  x: number;
  y: number;
}

/**
 * Hook to detect text selection and provide selection position
 * Returns: selectedText, position, and clear function
 * FIXED: Positions toolbar at selection END so mouse doesn't leave selection area
 */
export function useTextSelection<T extends HTMLElement = HTMLElement>(containerRef: React.RefObject<T | null>) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<SelectionPosition | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Continuously restore selection while toolbar is visible
  useEffect(() => {
    if (selectedText && savedRangeRef.current) {
      const restoreLoop = () => {
        if (savedRangeRef.current) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount === 0) {
            // Selection was cleared, restore it
            try {
              selection.addRange(savedRangeRef.current);
            } catch (e) {
              // Range might be invalid, ignore
            }
          }
        }
        animationFrameRef.current = requestAnimationFrame(restoreLoop);
      };

      animationFrameRef.current = requestAnimationFrame(restoreLoop);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [selectedText]);

  useEffect(() => {
    // Only check selection when mouse is released (not during drag)
    const handleMouseUp = () => {
      // Capture selection IMMEDIATELY, don't wait
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

            // Save the range IMMEDIATELY before anything can clear it
            savedRangeRef.current = range.cloneRange();

            setSelectedText(text);
            setPosition(toolbarPosition);
            return;
          }
        }
      }

      // Clear if no valid selection (but only if we're not showing toolbar)
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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

