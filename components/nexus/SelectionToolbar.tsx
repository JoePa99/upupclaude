'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SelectionToolbarProps {
  selectedText: string;
  onPin: (text: string) => void;
  onCreateArtifact: (text: string) => void;
  onAskFollowUp: (text: string) => void;
  onCopy: (text: string) => void;
  onEdit: (text: string) => void;
  position: { x: number; y: number } | null;
  onRestoreSelection: () => void;
}

/**
 * Floating toolbar that appears when text is selected
 * Provides quick actions: Pin, Artifact, Ask Follow-up, Copy, Edit
 */
export function SelectionToolbar({
  selectedText,
  onPin,
  onCreateArtifact,
  onAskFollowUp,
  onCopy,
  onEdit,
  position,
  onRestoreSelection,
}: SelectionToolbarProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  if (!position || !selectedText) return null;

  const handleCopy = () => {
    console.log('📋 Toolbar Copy clicked:', selectedText.substring(0, 50));
    onCopy(selectedText);
    setCopied(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        data-selection-toolbar
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onMouseDown={(e) => {
          // Prevent toolbar clicks from clearing the text selection
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseMove={(e) => {
          // Prevent mouse movement from triggering selection changes
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseEnter={(e) => {
          // Prevent mouse enter from triggering selection changes
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y - 60, // Position above selection
          zIndex: 9999,
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
        }}
        className="flex items-center gap-1 bg-white/95 backdrop-blur-2xl border-2 border-white/90 rounded-2xl shadow-super-glass px-2 py-2"
      >
        {/* Artifact Button */}
        <ToolbarButton
          icon="🧩"
          label="Artifact"
          onClick={() => {
            console.log('🧩 Toolbar Artifact clicked:', selectedText.substring(0, 50));
            onCreateArtifact(selectedText);
          }}
          tooltip="Save & edit as artifact"
        />

        {/* Artifact Button */}
        <ToolbarButton
          icon="🧩"
          label="Artifact"
          onClick={() => {
            console.log('🧩 Toolbar Artifact clicked:', selectedText.substring(0, 50));
            onCreateArtifact(selectedText);
          }}
          tooltip="Save & edit as artifact"
        />

        {/* Artifact Button */}
        <ToolbarButton
          icon="🧩"
          label="Artifact"
          onClick={() => {
            console.log('🧩 Toolbar Artifact clicked:', selectedText.substring(0, 50));
            onCreateArtifact(selectedText);
          }}
          tooltip="Save & edit as artifact"
        />

        {/* Artifact Button */}
        <ToolbarButton
          icon="🧩"
          label="Artifact"
          onClick={() => {
            console.log('🧩 Toolbar Artifact clicked:', selectedText.substring(0, 50));
            onCreateArtifact(selectedText);
          }}
          tooltip="Save & edit as artifact"
        />

        {/* Artifact Button */}
        <ToolbarButton
          icon="🧩"
          label="Artifact"
          onClick={() => {
            console.log('🧩 Toolbar Artifact clicked:', selectedText.substring(0, 50));
            onCreateArtifact(selectedText);
          }}
          tooltip="Save & edit as artifact"
        />

        {/* Ask Follow-up Button */}
        <ToolbarButton
          icon="💬"
          label="Ask"
          onClick={() => {
            console.log('💬 Toolbar Ask clicked:', selectedText.substring(0, 50));
            onAskFollowUp(selectedText);
          }}
          tooltip="Ask AI about this"
        />

        {/* Copy Button */}
        <ToolbarButton
          icon={copied ? '✓' : '📋'}
          label={copied ? 'Copied!' : 'Copy'}
          onClick={handleCopy}
          tooltip="Copy to clipboard"
          highlighted={copied}
        />

        {/* Edit Button */}
        <ToolbarButton
          icon="✏️"
          label="Edit"
          onClick={() => {
            console.log('✏️ Toolbar Edit clicked:', selectedText.substring(0, 50));
            onEdit(selectedText);
          }}
          tooltip="Edit in artifact"
        />
      </motion.div>
    </AnimatePresence>
  );
}

interface ToolbarButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  tooltip: string;
  highlighted?: boolean;
}

function ToolbarButton({ icon, label, onClick, tooltip, highlighted }: ToolbarButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      onMouseDown={(e) => {
        // Prevent button clicks from clearing the text selection
        e.preventDefault();
        e.stopPropagation();
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
      }}
      className={`
        flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs
        transition-all duration-200
        ${
          highlighted
            ? 'bg-luminous-accent-cyan text-white'
            : 'bg-white/60 hover:bg-gradient-to-r hover:from-luminous-accent-cyan/20 hover:to-luminous-accent-purple/20 text-luminous-text-primary'
        }
        border border-white/70 shadow-sm hover:shadow-md
      `}
      title={tooltip}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </motion.button>
  );
}
