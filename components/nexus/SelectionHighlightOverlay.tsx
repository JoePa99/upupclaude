'use client';

import { createPortal } from 'react-dom';

type HighlightRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

interface SelectionHighlightOverlayProps {
  rects: HighlightRect[];
}

export function SelectionHighlightOverlay({ rects }: SelectionHighlightOverlayProps) {
  if (typeof document === 'undefined' || rects.length === 0) return null;

  return createPortal(
    <div
      data-pin-highlight-layer
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    >
      {rects.map((rect, index) => (
        <div
          key={`${rect.left}-${rect.top}-${rect.width}-${rect.height}-${index}`}
          style={{
            position: 'absolute',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            background: 'rgba(86, 227, 255, 0.3)',
            borderRadius: 6,
            boxShadow: '0 0 0 1px rgba(86, 227, 255, 0.4)',
          }}
        />
      ))}
    </div>,
    document.body
  );
}

