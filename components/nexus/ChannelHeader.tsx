'use client';

import { motion } from 'framer-motion';
import type { Channel } from '@/types';

interface ChannelHeaderProps {
  channel: Channel;
  onClearHistory?: () => void;
  onEditChannel?: () => void;
  onDeleteChannel?: () => void;
  onTogglePinboard?: () => void;
  pinCount?: number;
  onToggleArtifacts?: () => void;
  artifactCount?: number;
}

/**
 * NEXUS Channel Header - Glass styled header with controls
 */
export function ChannelHeader({
  channel,
  onClearHistory,
  onEditChannel,
  onDeleteChannel,
  onTogglePinboard,
  pinCount = 0,
  onToggleArtifacts,
  artifactCount = 0,
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
        {/* Artifact Library Button */}
        {onToggleArtifacts && (
          <motion.button
            onClick={onToggleArtifacts}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-luminous-accent-cyan/20 to-luminous-accent-purple/20 hover:from-luminous-accent-cyan/30 hover:to-luminous-accent-purple/30 border border-white/70 text-luminous-text-primary text-sm font-bold transition-all flex items-center gap-2"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-base">🧩</span>
            <span>Artifacts</span>
            {artifactCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-luminous-accent-cyan text-white text-xs font-extrabold">
                {artifactCount}
              </span>
            )}
          </motion.button>
        )}

        {/* Artifact Library Button */}
        {onToggleArtifacts && (
          <motion.button
            onClick={onToggleArtifacts}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-luminous-accent-cyan/20 to-luminous-accent-purple/20 hover:from-luminous-accent-cyan/30 hover:to-luminous-accent-purple/30 border border-white/70 text-luminous-text-primary text-sm font-bold transition-all flex items-center gap-2"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-base">🧩</span>
            <span>Artifacts</span>
            {artifactCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-luminous-accent-cyan text-white text-xs font-extrabold">
                {artifactCount}
              </span>
            )}
          </motion.button>
        )}

        {/* Artifact Library Button */}
        {onToggleArtifacts && (
          <motion.button
            onClick={onToggleArtifacts}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-luminous-accent-cyan/20 to-luminous-accent-purple/20 hover:from-luminous-accent-cyan/30 hover:to-luminous-accent-purple/30 border border-white/70 text-luminous-text-primary text-sm font-bold transition-all flex items-center gap-2"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-base">🧩</span>
            <span>Artifacts</span>
            {artifactCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-luminous-accent-cyan text-white text-xs font-extrabold">
                {artifactCount}
              </span>
            )}
          </motion.button>
        )}
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
