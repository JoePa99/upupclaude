'use client';

import { motion } from 'framer-motion';
import type { Channel, Assistant, Workspace, User } from '@/types';

interface NexusSidebarProps {
  workspace: Workspace;
  currentChannel: Channel;
  currentUser: User;
  onChannelSelect: (channel: Channel) => void;
  onAgentSelect?: (agent: Assistant) => void;
}

/**
 * NEXUS Sidebar - Detached glass panel with Projects and Agent Dock
 */
export function NexusSidebar({
  workspace,
  currentChannel,
  currentUser,
  onChannelSelect,
  onAgentSelect,
}: NexusSidebarProps) {
  return (
    <div className="w-80 h-screen p-6 flex flex-col gap-6">
      {/* Workspace Header */}
      <motion.div
        className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-luminous shadow-luminous p-6"
        whileHover={{ scale: 1.005, y: -2, boxShadow: '0 24px 48px -12px rgba(198, 88, 255, 0.15)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <h1 className="text-2xl font-extrabold tracking-tight text-luminous-text-primary mb-1">
          {workspace.name}
        </h1>
        <p className="text-sm text-luminous-text-secondary font-medium">
          {currentUser.name}
        </p>
      </motion.div>

      {/* Channels / Projects */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-luminous shadow-luminous p-4 space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xs font-extrabold tracking-wider uppercase text-luminous-text-secondary px-3 py-2">
            Projects
          </h2>

          {workspace.channels.map((channel, index) => {
            const isActive = channel.id === currentChannel.id;

            return (
              <motion.button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={`w-full px-4 py-3 rounded-2xl text-left transition-all ${
                  isActive
                    ? 'bg-white/90 shadow-luminous-glow'
                    : 'hover:bg-white/40'
                }`}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-luminous-accent-purple' : 'bg-luminous-text-tertiary'
                  }`} />
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${
                      isActive ? 'text-luminous-text-primary' : 'text-luminous-text-secondary'
                    }`}>
                      {channel.name}
                    </div>
                    {channel.description && (
                      <div className="text-xs text-luminous-text-tertiary mt-0.5 truncate">
                        {channel.description}
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Agent Dock */}
      <motion.div
        className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-luminous shadow-luminous p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xs font-extrabold tracking-wider uppercase text-luminous-text-secondary px-3 py-2 mb-2">
          AI Teammates
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {workspace.assistants.slice(0, 6).map((agent, index) => {
            const colorMap: Record<string, string> = {
              cyan: '#56E3FF',
              purple: '#C658FF',
              coral: '#FF5A5F',
              yellow: '#FFC107',
            };
            const bgColor = colorMap[agent.colorTheme || 'purple'] || colorMap.purple;

            return (
              <motion.button
                key={agent.id}
                onClick={() => onAgentSelect?.(agent)}
                className="relative group"
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                {/* Pulsing indicator (online status) */}
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse-glow z-10" />

                {/* Agent Avatar */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-luminous group-hover:shadow-luminous-hover transition-shadow"
                  style={{ backgroundColor: bgColor }}
                >
                  {agent.name.charAt(0).toUpperCase()}
                </div>

                {/* Agent Name (on hover) */}
                <motion.div
                  className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-luminous-text-primary text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none"
                  initial={{ y: -5 }}
                  whileHover={{ y: 0 }}
                >
                  {agent.name}
                </motion.div>
              </motion.button>
            );
          })}
        </div>

        {workspace.assistants.length > 6 && (
          <div className="text-center mt-4">
            <button className="text-xs text-luminous-accent-purple font-bold hover:underline">
              +{workspace.assistants.length - 6} more
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
