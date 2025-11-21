'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ExpandableText } from './ExpandableText';
import { CollapsibleSection } from './CollapsibleSection';
import { useArtifactStore } from '@/stores/artifactStore';

interface ArtifactPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ArtifactPanel({ isOpen, onClose }: ArtifactPanelProps) {
  const {
    artifacts,
    activeArtifactId,
    setActiveArtifact,
    updateArtifact,
    removeArtifact,
  } = useArtifactStore();

  const [search, setSearch] = useState('');
  const activeArtifact = artifacts.find((artifact) => artifact.id === activeArtifactId) || artifacts[0];
  const [draft, setDraft] = useState(activeArtifact?.content || '');
  const [title, setTitle] = useState(activeArtifact?.title || '');

  useEffect(() => {
    setDraft(activeArtifact?.content || '');
    setTitle(activeArtifact?.title || '');
  }, [activeArtifact?.content, activeArtifact?.title]);

  const filteredArtifacts = useMemo(() => {
    if (!search.trim()) return artifacts;

    const query = search.toLowerCase();
    return artifacts.filter(
      (artifact) =>
        artifact.title.toLowerCase().includes(query) ||
        artifact.content.toLowerCase().includes(query)
    );
  }, [artifacts, search]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[520px] bg-luminous-bg shadow-2xl z-50 flex flex-col"
          >
            <header className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-luminous-accent-cyan/20 via-luminous-accent-purple/20 to-luminous-accent-coral/20">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧩</span>
                  <div>
                    <p className="text-xs font-semibold text-luminous-text-tertiary uppercase tracking-wide">
                      Artifact Library
                    </p>
                    <h2 className="text-xl font-extrabold text-luminous-text-primary leading-tight">
                      Crafted, editable outputs
                    </h2>
                  </div>
                </div>

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-full bg-white/70 hover:bg-white text-luminous-text-primary flex items-center justify-center font-extrabold shadow-sm"
                >
                  ✕
                </motion.button>
              </div>

              <div className="relative mt-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search artifacts by title or content"
                  className="w-full px-4 py-2 pl-11 rounded-xl bg-white/70 border border-white/70 text-luminous-text-primary placeholder-luminous-text-tertiary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-luminous-accent-cyan/60 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luminous-text-tertiary">
                  🔎
                </span>
              </div>
            </header>

            <div className="flex-1 grid grid-rows-[1.2fr_1fr] min-h-0">
              <section className="overflow-y-auto px-6 py-4 space-y-3 border-b border-white/10">
                {filteredArtifacts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <span className="text-6xl mb-3">✨</span>
                    <h3 className="text-lg font-bold text-luminous-text-primary mb-1">No artifacts yet</h3>
                    <p className="text-sm text-luminous-text-tertiary max-w-xs">
                      Highlight text in the message stream and choose “Artifact” to start saving editable work.
                    </p>
                  </div>
                ) : (
                  filteredArtifacts.map((artifact) => (
                    <motion.button
                      key={artifact.id}
                      onClick={() => setActiveArtifact(artifact.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`w-full text-left rounded-2xl border px-4 py-3 transition-all duration-200 shadow-sm backdrop-blur-xl ${
                        artifact.id === activeArtifact?.id
                          ? 'bg-white/80 border-luminous-accent-cyan/50 shadow-luminous'
                          : 'bg-white/60 border-white/80 hover:bg-white/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-full bg-luminous-accent-cyan/15 text-luminous-accent-cyan text-[11px] font-extrabold uppercase tracking-wide">
                              Artifact
                            </span>
                            <span className="text-[11px] font-semibold text-luminous-text-tertiary">
                              Updated {new Date(artifact.updatedAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <h3 className="text-sm font-extrabold text-luminous-text-primary mb-1 line-clamp-1">
                            {artifact.title || 'Untitled artifact'}
                          </h3>
                          <div className="text-xs text-luminous-text-secondary">
                            <ExpandableText maxLength={260} previewLength={140}>
                              {artifact.content}
                            </ExpandableText>
                          </div>
                        </div>

                        <motion.button
                          onClick={(event) => {
                            event.stopPropagation();
                            removeArtifact(artifact.id);
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="w-7 h-7 rounded-full bg-luminous-accent-coral/80 hover:bg-luminous-accent-coral text-white text-xs font-bold flex items-center justify-center"
                          title="Delete artifact"
                        >
                          ✕
                        </motion.button>
                      </div>
                    </motion.button>
                  ))
                )}
              </section>

              <section className="p-6 overflow-y-auto">
                {activeArtifact ? (
                  <CollapsibleSection
                    title="Edit & save"
                    icon="✏️"
                    defaultOpen
                    badge={draft.length}
                    variant="card"
                  >
                    <div className="space-y-3">
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Artifact title"
                        className="w-full px-4 py-2 rounded-xl bg-white/80 border border-white/80 text-luminous-text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-luminous-accent-cyan/50"
                      />

                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className="w-full min-h-[180px] rounded-2xl bg-white/70 border border-white/80 px-4 py-3 text-sm text-luminous-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-luminous-accent-purple/50"
                        placeholder="Edit your artifact content..."
                      />

                      <div className="flex items-center justify-between text-xs text-luminous-text-tertiary">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-luminous-accent-purple/10 text-luminous-accent-purple font-bold">
                            {draft.split(/\s+/).filter(Boolean).length} words
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-luminous-accent-cyan/10 text-luminous-accent-cyan font-bold">
                            {draft.length} chars
                          </span>
                        </div>
                        {activeArtifact.sourceMessageId && (
                          <span className="font-semibold text-luminous-text-secondary">
                            Sourced from message {activeArtifact.sourceMessageId.slice(0, 6)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <motion.button
                          onClick={() => {
                            setDraft(activeArtifact.content);
                            setTitle(activeArtifact.title);
                          }}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          className="px-4 py-2 rounded-xl bg-white/70 border border-white/80 text-sm font-bold text-luminous-text-secondary"
                        >
                          Reset
                        </motion.button>
                        <motion.button
                          onClick={() => {
                            updateArtifact(activeArtifact.id, { content: draft, title });
                          }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-luminous"
                          style={{
                            background: 'linear-gradient(135deg, #56E3FF, #C658FF)',
                          }}
                        >
                          Save changes
                        </motion.button>
                      </div>
                    </div>
                  </CollapsibleSection>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-luminous-text-secondary">
                    <span className="text-4xl mb-2">🧭</span>
                    <p className="font-semibold">Select an artifact to edit</p>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
