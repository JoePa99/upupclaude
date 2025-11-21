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
  const highlightNameRef = useRef('pin-selection-highlight');
  const highlightStyleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // Inject highlight styling at runtime to avoid bundler CSS parser limitations
    const styleEl = document.createElement('style');
    styleEl.setAttribute('data-pin-highlight-style', '');
    styleEl.textContent = `::highlight(${highlightNameRef.current}) { background: rgba(86, 227, 255, 0.3); border-radius: 6px; box-shadow: 0 0 0 1px rgba(86, 227, 255, 0.4); }`;
    document.head.appendChild(styleEl);
    highlightStyleRef.current = styleEl;

    return () => {
      styleEl.remove();
      highlightStyleRef.current = null;
    };
  }, []);

  const applyPersistentHighlight = (range: Range) => {
    const cssApi = (window as any).CSS;
    const HighlightCtor = (window as any).Highlight;

    if (!cssApi?.highlights || !HighlightCtor) {
      return;
    }

    const highlight = new HighlightCtor(range.cloneRange());
    cssApi.highlights.set(highlightNameRef.current, highlight);
  };

  const clearPersistentHighlight = () => {
    const cssApi = (window as any).CSS;
    if (cssApi?.highlights) {
      cssApi.highlights.delete(highlightNameRef.current);
    }
  };

  const clearPersistentHighlight = () => {};

  const clearPersistentHighlight = () => {};

  // Continuously restore selection while toolbar is visible
  useEffect(() => {
    if (selectedText && savedRangeRef.current) {
      const restoreSelection = () => {
        const selection = window.getSelection();
        const currentText = selection?.toString() ?? '';

        // Restore when the browser collapses the range (common when clicking the toolbar)
        // or if the selection was completely removed
        if (selection && (selection.rangeCount === 0 || selection.isCollapsed || currentText === '')) {
          try {
            selection.removeAllRanges();
            selection.addRange(savedRangeRef.current!);
          } catch (e) {
            // Range might be invalid, ignore
      const restoreLoop = () => {
        if (savedRangeRef.current) {
          const selection = window.getSelection();
          const currentText = selection?.toString() ?? '';

          // Restore when the browser collapses the range (common when clicking the toolbar)
          // or if the selection was completely removed
          if (selection && (selection.rangeCount === 0 || currentText === '')) {
            try {
              selection.removeAllRanges();
              selection.addRange(savedRangeRef.current);
            } catch (e) {
              // Range might be invalid, ignore
            }
          }
        }
      };

      const handleSelectionChange = () => {
        // Delay restoration to after the browser updates the selection
        animationFrameRef.current = requestAnimationFrame(restoreSelection);
      };

      document.addEventListener('selectionchange', handleSelectionChange);
      // Immediately restore once so mouseup doesn't clear the highlight
      handleSelectionChange();

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
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

            applyPersistentHighlight(range);

            // Force the browser to keep showing the selection even after mouseup
            requestAnimationFrame(() => {
              try {
                const selection = window.getSelection();
                selection?.removeAllRanges();
                if (savedRangeRef.current) {
                  selection?.addRange(savedRangeRef.current);
                }
              } catch (e) {
                // ignore invalid ranges
              }
            });

            setSelectedText(text);
            setPosition(toolbarPosition);
            return;
          }
        }
      }

      // Clear if no valid selection (but only if we're not showing toolbar)
      if (!savedRangeRef.current) {
        clearPersistentHighlight();
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
      clearPersistentHighlight();
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
    clearPersistentHighlight();
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

