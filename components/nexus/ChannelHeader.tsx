'use client';

import { motion } from 'framer-motion';
import type { Channel } from '@/types';

interface ChannelHeaderProps {
  channel: Channel;
  onClearHistory?: () => void;
  onEditChannel?: () => void;
  onDeleteChannel?: () => void;
}

/**
 * NEXUS Channel Header - Glass styled header with controls
 */
export function ChannelHeader({
  channel,
  onClearHistory,
  onEditChannel,
  onDeleteChannel,
}: ChannelHeaderProps) {
  return (
    <motion.div
      className="bg-white/50 backdrop-blur-xl border-b border-white/60 px-8 py-4 flex items-center justify-between"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Channel Info */}
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-luminous-text-primary">
          {channel.isDm ? `${channel.name}` : `# ${channel.name}`}
        </h2>
        {channel.description && (
          <p className="text-sm text-luminous-text-secondary font-medium mt-0.5">
            {channel.description}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {channel.isDm && onClearHistory && (
          <motion.button
            onClick={onClearHistory}
            className="px-4 py-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/70 text-luminous-text-secondary hover:text-luminous-text-primary text-sm font-bold transition-colors"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear History
          </motion.button>
        )}

        {!channel.isDm && onEditChannel && (
          <motion.button
            onClick={onEditChannel}
            className="px-4 py-2 rounded-xl bg-white/60 hover:bg-white/80 border border-white/70 text-luminous-text-secondary hover:text-luminous-text-primary text-sm font-bold transition-colors"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Edit
          </motion.button>
        )}

        {!channel.isDm && onDeleteChannel && (
          <motion.button
            onClick={onDeleteChannel}
            className="px-4 py-2 rounded-xl bg-white/60 hover:bg-luminous-accent-coral/20 border border-white/70 hover:border-luminous-accent-coral/50 text-luminous-text-secondary hover:text-luminous-accent-coral text-sm font-bold transition-colors"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Delete
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
