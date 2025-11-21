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
  const highlightLayerRef = useRef<HTMLDivElement | null>(null);

  const ensureHighlightLayer = () => {
    if (typeof document === 'undefined') return null;
    if (!highlightLayerRef.current) {
      const layer = document.createElement('div');
      layer.setAttribute('data-pin-highlight-layer', 'true');
      layer.style.position = 'absolute';
      layer.style.top = '0';
      layer.style.left = '0';
      layer.style.width = '100%';
      layer.style.height = '100%';
      layer.style.pointerEvents = 'none';
      layer.style.zIndex = '9999';
      document.body.appendChild(layer);
      highlightLayerRef.current = layer;
    }
    return highlightLayerRef.current;
  };

  const clearPersistentHighlight = () => {
    const layer = highlightLayerRef.current;
    if (layer) {
      layer.innerHTML = '';
    }
  };

  const renderPersistentHighlight = () => {
    const layer = ensureHighlightLayer();
    if (!layer) return;

    layer.innerHTML = '';

    if (!savedRangeRef.current) return;

    const rects = Array.from(savedRangeRef.current.getClientRects());
    rects.forEach((rect) => {
      if (rect.width === 0 || rect.height === 0) return;
      const highlight = document.createElement('div');
      highlight.style.position = 'absolute';
      highlight.style.left = `${rect.left + window.scrollX}px`;
      highlight.style.top = `${rect.top + window.scrollY}px`;
      highlight.style.width = `${rect.width}px`;
      highlight.style.height = `${rect.height}px`;
      highlight.style.background = 'rgba(86, 227, 255, 0.3)';
      highlight.style.borderRadius = '6px';
      highlight.style.boxShadow = '0 0 0 1px rgba(86, 227, 255, 0.4)';
      highlightLayerRef.current?.appendChild(highlight);
    });
  };

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
            renderPersistentHighlight();
          } catch (e) {
            // Range might be invalid, ignore
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
        clearPersistentHighlight();
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

            // Draw a persistent overlay so the highlight remains even if the browser clears native selection
            renderPersistentHighlight();

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
      document.addEventListener('scroll', renderPersistentHighlight, true);
      window.addEventListener('resize', renderPersistentHighlight);

      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('scroll', renderPersistentHighlight, true);
        window.removeEventListener('resize', renderPersistentHighlight);
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
        renderPersistentHighlight();
      } catch (e) {
        console.warn('Failed to restore selection:', e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (highlightLayerRef.current) {
        highlightLayerRef.current.remove();
        highlightLayerRef.current = null;
      }
    };
  }, []);

  return { selectedText, position, clearSelection, restoreSelection };
}

