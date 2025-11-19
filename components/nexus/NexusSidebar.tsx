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
              <div className="flex items-center gap-2">
                {/* Only show assistant creation for admin/assistant_creator */}
                {onAssistantCreated && (currentUser.role === 'admin' || currentUser.role === 'assistant_creator') && (
                  <motion.button
                    onClick={() => setShowCreateAssistant(true)}
                    className="w-6 h-6 rounded-full bg-luminous-accent-cyan/10 hover:bg-luminous-accent-cyan/20 flex items-center justify-center text-luminous-accent-cyan font-bold text-xs transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Create AI Assistant"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </motion.button>
                )}
                {onChannelCreated && (
                  <motion.button
                    onClick={() => setShowCreateChannel(true)}
                    className="w-6 h-6 rounded-full bg-luminous-accent-purple/10 hover:bg-luminous-accent-purple/20 flex items-center justify-center text-luminous-accent-purple font-bold text-xs transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Create Project"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </motion.button>
                )}
              </div>
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

      {(currentUser.role === 'admin' || currentUser.role === 'assistant_creator') && (
        <CreateAssistantModal
          isOpen={showCreateAssistant}
          onClose={() => setShowCreateAssistant(false)}
          onSuccess={() => {
            setShowCreateAssistant(false);
            onAssistantCreated?.();
          }}
        />
      )}
    </>
  );
}
