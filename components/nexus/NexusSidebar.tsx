'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreateChannelModal } from '@/components/CreateChannelModal';
import { CreateAssistantModal } from '@/components/CreateAssistantModal';
import type { Channel, Assistant, Workspace, User } from '@/types';

interface NexusSidebarProps {
  workspace: Workspace;
  currentChannel: Channel;
  currentUser: User;
  onChannelSelect: (channel: Channel) => void;
  onAgentSelect?: (agent: Assistant) => void;
  onAssistantCreated?: () => void;
  onChannelCreated?: () => void;
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
  onAssistantCreated,
  onChannelCreated,
}: NexusSidebarProps) {
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showCreateAssistant, setShowCreateAssistant] = useState(false);

  return (
    <>
      <div className="w-80 h-screen p-4 flex flex-col gap-4">
        {/* Workspace Header */}
        <motion.div
          className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-luminous shadow-luminous p-5"
          whileHover={{ scale: 1.005, y: -1, boxShadow: '0 24px 48px -12px rgba(198, 88, 255, 0.15)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <h1 className="text-xl font-extrabold tracking-tight text-luminous-text-primary mb-0.5">
            {workspace.name}
          </h1>
          <p className="text-xs text-luminous-text-secondary font-medium">
            {currentUser.name}
          </p>
        </motion.div>

        {/* Channels / Projects */}
        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-luminous shadow-luminous p-3 space-y-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between px-2 py-1.5">
              <h2 className="text-xs font-extrabold tracking-wider uppercase text-luminous-text-secondary">
                Projects
              </h2>
              {onChannelCreated && (
                <motion.button
                  onClick={() => setShowCreateChannel(true)}
                  className="w-6 h-6 rounded-full bg-luminous-accent-purple/10 hover:bg-luminous-accent-purple/20 flex items-center justify-center text-luminous-accent-purple font-bold text-sm transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  +
                </motion.button>
              )}
            </div>

            {workspace.channels.map((channel, index) => {
              const isActive = channel.id === currentChannel.id;

              return (
                <motion.button
                  key={channel.id}
                  onClick={() => onChannelSelect(channel)}
                  className={`w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-white/90 shadow-luminous-glow'
                      : 'hover:bg-white/40'
                  }`}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isActive ? 'bg-luminous-accent-purple' : 'bg-luminous-text-tertiary'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold text-xs truncate ${
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
          className="bg-white/65 backdrop-blur-2xl border border-white/80 rounded-luminous shadow-luminous p-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between px-2 py-1.5 mb-2">
            <h2 className="text-xs font-extrabold tracking-wider uppercase text-luminous-text-secondary">
              AI Teammates
            </h2>
            {onAssistantCreated && (
              <motion.button
                onClick={() => setShowCreateAssistant(true)}
                className="w-6 h-6 rounded-full bg-luminous-accent-cyan/10 hover:bg-luminous-accent-cyan/20 flex items-center justify-center text-luminous-accent-cyan font-bold text-sm transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                +
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
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
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                >
                  {/* Pulsing indicator (online status) */}
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-white animate-pulse-glow z-10" />

                  {/* Agent Avatar */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-luminous group-hover:shadow-luminous-hover transition-shadow"
                    style={{ backgroundColor: bgColor }}
                  >
                    {agent.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Agent Name (on hover) */}
                  <motion.div
                    className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-luminous-text-primary text-white px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-20"
                    initial={{ y: -3 }}
                    whileHover={{ y: 0 }}
                  >
                    {agent.name}
                  </motion.div>
                </motion.button>
              );
            })}
          </div>

          {workspace.assistants.length > 6 && (
            <div className="text-center mt-3">
              <button className="text-xs text-luminous-accent-purple font-bold hover:underline">
                +{workspace.assistants.length - 6} more
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Creation Modals */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onSuccess={() => {
          setShowCreateChannel(false);
          onChannelCreated?.();
        }}
        workspaceUsers={workspace.users}
        workspaceAssistants={workspace.assistants}
      />

      <CreateAssistantModal
        isOpen={showCreateAssistant}
        onClose={() => setShowCreateAssistant(false)}
        onSuccess={() => {
          setShowCreateAssistant(false);
          onAssistantCreated?.();
        }}
      />
    </>
  );
}
