'use client';

import { useState, useEffect, useRef } from 'react';

interface SelectionPosition {
  x: number;
  y: number;
}

/**
 * Hook to detect text selection and provide selection position
 * Returns: selectedText, position, and clear function
 * FIXED: Uses requestAnimationFrame for frame-perfect selection restoration
 */
export function useTextSelection<T extends HTMLElement = HTMLElement>(containerRef: React.RefObject<T | null>) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<SelectionPosition | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Continuous restoration using requestAnimationFrame for smoothness
  useEffect(() => {
    if (selectedText && savedRangeRef.current) {
      const restoreLoop = () => {
        if (savedRangeRef.current) {
          const selection = window.getSelection();
          const currentText = selection?.toString().trim() || '';

          // If selection is lost or different, restore it
          if (!currentText || currentText !== selectedText) {
            try {
              selection?.removeAllRanges();
              selection?.addRange(savedRangeRef.current);
            } catch (e) {
              // Silently fail - range might be invalid
            }
          }
        }

        // Continue the loop
        animationFrameRef.current = requestAnimationFrame(restoreLoop);
      };

      // Start the restoration loop
      animationFrameRef.current = requestAnimationFrame(restoreLoop);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [selectedText]);

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

              // Save the range so we can restore it if needed
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
      }, 50);
    };

    // Clear selection when clicking (starting new selection)
    const handleMouseDown = (e: MouseEvent) => {
      // Don't clear if clicking within the toolbar area
      const target = e.target as HTMLElement;
      if (target.closest('[data-selection-toolbar]')) {
        return;
      }

      setSelectedText('');
      setPosition(null);
      savedRangeRef.current = null;

      // Clear the animation frame if it exists
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

    // Clear the animation frame if it exists
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    window.getSelection()?.removeAllRanges();
  };

  const restoreSelection = () => {
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
