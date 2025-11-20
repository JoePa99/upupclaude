'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { Pin } from '@/types';

interface PinboardProps {
  isOpen: boolean;
  onClose: () => void;
  pins: Pin[];
  onDeletePin: (pinId: string) => void;
  onPinClick: (pin: Pin) => void;
}

/**
 * Pinboard - Slide-out panel showing saved pins
 * Users can browse, search, and organize their pinned content
 */
export function Pinboard({ isOpen, onClose, pins, onDeletePin, onPinClick }: PinboardProps) {
  console.log('📌 Pinboard render:', { isOpen, pinsCount: pins.length });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Filter pins based on search and collection
  const filteredPins = pins.filter((pin) => {
    const matchesSearch = !searchQuery || pin.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = !selectedCollection || pin.collection === selectedCollection;
    return matchesSearch && matchesCollection;
  });

  // Get unique collections
  const collections = Array.from(new Set(pins.map((pin) => pin.collection).filter((c): c is string => !!c)));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Pinboard Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-luminous-bg shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-luminous-accent-cyan/20 via-luminous-accent-purple/20 to-luminous-accent-coral/20 px-6 py-4 border-b border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📌</span>
                  <div>
                    <h2 className="text-xl font-extrabold text-luminous-text-primary">
                      Pinboard
                    </h2>
                    <p className="text-xs text-luminous-text-tertiary font-medium">
                      {pins.length} {pins.length === 1 ? 'pin' : 'pins'} saved
                    </p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center text-luminous-text-primary font-bold transition-colors"
                >
                  ✕
                </motion.button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search pins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 rounded-xl bg-white/60 border border-white/70 text-luminous-text-primary placeholder-luminous-text-tertiary text-sm font-medium focus:outline-none focus:ring-2 focus:ring-luminous-accent-cyan/50 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-luminous-text-tertiary">
                  🔍
                </span>
              </div>

              {/* Collections Filter */}
              {collections.length > 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  <CollectionChip
                    label="All"
                    count={pins.length}
                    isActive={!selectedCollection}
                    onClick={() => setSelectedCollection(null)}
                  />
                  {collections.map((collection) => (
                    <CollectionChip
                      key={collection}
                      label={collection || 'Uncategorized'}
                      count={pins.filter((p) => p.collection === collection).length}
                      isActive={selectedCollection === collection}
                      onClick={() => setSelectedCollection(collection)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pins List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {filteredPins.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <span className="text-6xl mb-4">📌</span>
                  <h3 className="text-lg font-bold text-luminous-text-primary mb-2">
                    {searchQuery ? 'No pins found' : 'No pins yet'}
                  </h3>
                  <p className="text-sm text-luminous-text-tertiary max-w-xs">
                    {searchQuery
                      ? 'Try a different search term'
                      : 'Select text in any message and click the pin button to save it here'}
                  </p>
                </div>
              ) : (
                filteredPins.map((pin) => (
                  <PinCard
                    key={pin.id}
                    pin={pin}
                    onDelete={() => onDeletePin(pin.id)}
                    onClick={() => onPinClick(pin)}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CollectionChipProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function CollectionChip({ label, count, isActive, onClick }: CollectionChipProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap
        transition-all duration-200
        ${
          isActive
            ? 'bg-gradient-to-r from-luminous-accent-cyan to-luminous-accent-purple text-white shadow-md'
            : 'bg-white/60 text-luminous-text-primary hover:bg-white/90'
        }
        border border-white/70
      `}
    >
      <span>{label}</span>
      <span
        className={`
        text-xs font-extrabold
        ${isActive ? 'text-white/80' : 'text-luminous-text-tertiary'}
      `}
      >
        {count}
      </span>
    </motion.button>
  );
}

interface PinCardProps {
  pin: Pin;
  onDelete: () => void;
  onClick: () => void;
}

function PinCard({ pin, onDelete, onClick }: PinCardProps) {
  const [showDelete, setShowDelete] = useState(false);

  // Handle click only if no text is selected
  const handleCardClick = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;

    // Only trigger onClick if there's no text selection
    if (!hasSelection) {
      onClick();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      onClick={handleCardClick}
      className="bg-white/80 backdrop-blur-xl border border-white/90 rounded-2xl p-4 shadow-luminous transition-all relative overflow-hidden hover:shadow-xl"
      style={{ cursor: 'default' }}
    >
      {/* Delete Button */}
      <AnimatePresence>
        {showDelete && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-luminous-accent-coral/90 hover:bg-luminous-accent-coral text-white flex items-center justify-center text-xs font-bold shadow-md z-10"
          >
            ✕
          </motion.button>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="space-y-2">
        <p
          className="text-sm text-luminous-text-primary font-medium line-clamp-3 leading-relaxed"
          style={{ userSelect: 'text', cursor: 'text' }}
        >
          {pin.content}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between pt-2 border-t border-luminous-text-tertiary/10">
          <div className="flex items-center gap-2">
            {pin.collection && (
              <span className="px-2 py-0.5 rounded-full bg-luminous-accent-purple/10 text-luminous-accent-purple text-xs font-bold">
                {pin.collection}
              </span>
            )}
            {pin.tags && pin.tags.length > 0 && (
              <span className="text-xs text-luminous-text-tertiary font-medium">
                {pin.tags.slice(0, 2).join(', ')}
              </span>
            )}
          </div>
          <span className="text-xs text-luminous-text-tertiary font-medium">
            {new Date(pin.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Gradient Border on Hover */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent hover:border-gradient-to-r hover:from-luminous-accent-cyan hover:to-luminous-accent-purple opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.div>
  );
}
