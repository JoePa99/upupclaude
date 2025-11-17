'use client';

import { useState } from 'react';
import { Channel, Assistant, Workspace, User } from '@/types';
import { cn, getInitials } from '@/lib/utils';
import { motion } from 'framer-motion';
import { CreateAssistantModal } from './CreateAssistantModal';
import { CreateChannelModal } from './CreateChannelModal';

interface SidebarProps {
  workspace: Workspace;
  currentChannel: Channel;
  currentUser: User;
  onChannelSelect: (channel: Channel) => void;
  onAssistantCreated: () => void;
  onChannelCreated: () => void;
}

export function Sidebar({
  workspace,
  currentChannel,
  currentUser,
  onChannelSelect,
  onAssistantCreated,
  onChannelCreated,
}: SidebarProps) {
  const [showCreateAssistant, setShowCreateAssistant] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [loadingDM, setLoadingDM] = useState<string | null>(null);

  const handleAssistantClick = async (assistant: Assistant) => {
    if (loadingDM) return; // Prevent multiple clicks

    setLoadingDM(assistant.id);
    try {
      const response = await fetch(`/api/channels/dm/${assistant.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create DM channel');
      }

      // Navigate to the DM channel
      onChannelSelect(data.channel);
    } catch (error: any) {
      console.error('Error creating DM channel:', error);
      alert(error.message || 'Failed to create DM channel');
    } finally {
      setLoadingDM(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-64 border-r border-border bg-background-secondary flex flex-col h-full"
    >
      {/* Workspace header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-serif font-semibold text-foreground">
          {workspace.name}
        </h1>
        <p className="text-xs text-foreground-tertiary mt-1">
          {workspace.users.length} members · {workspace.assistants.length} AI
          assistants
        </p>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-foreground-tertiary uppercase tracking-wide">
              Channels
            </h2>
            <button
              onClick={() => setShowCreateChannel(true)}
              className="text-accent hover:text-accent-hover transition-colors text-sm"
            >
              +
            </button>
          </div>

          <div className="space-y-1">
            {workspace.channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all group',
                  currentChannel.id === channel.id
                    ? 'bg-accent/10 text-accent border-l-2 border-accent'
                    : 'text-foreground-secondary hover:bg-background-tertiary hover:text-foreground'
                )}
              >
                <span className="text-foreground-tertiary group-hover:text-accent transition-colors">
                  {channel.isPrivate ? '🔒' : '#'}
                </span>
                <span className="flex-1 text-sm font-mono">
                  {channel.name}
                </span>
                {channel.unreadCount && channel.unreadCount > 0 && (
                  <span className="bg-accent text-background text-xs px-1.5 py-0.5 rounded font-semibold">
                    {channel.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistants */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-foreground-tertiary uppercase tracking-wide">
              AI Assistants
            </h2>
            <button
              onClick={() => setShowCreateAssistant(true)}
              className="text-accent hover:text-accent-hover transition-colors text-sm"
            >
              +
            </button>
          </div>

          <div className="space-y-1">
            {workspace.assistants.map((assistant) => (
              <button
                key={assistant.id}
                onClick={() => handleAssistantClick(assistant)}
                disabled={loadingDM === assistant.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-tertiary transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                title="Click to start a direct message"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-ai/20 border border-ai/30 flex items-center justify-center text-ai text-sm">
                    {loadingDM === assistant.id ? (
                      <div className="animate-spin">⏳</div>
                    ) : (
                      '◆'
                    )}
                  </div>
                  {assistant.status === 'online' && loadingDM !== assistant.id && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-ai rounded-full border-2 border-background-secondary animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-sm text-foreground font-medium truncate">
                    {assistant.name}
                  </div>
                  <div className="text-xs text-foreground-tertiary truncate">
                    {loadingDM === assistant.id
                      ? 'Opening DM...'
                      : assistant.model.provider}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-foreground-tertiary text-xs">
                  💬
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-background text-sm font-semibold">
            {getInitials(currentUser.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground font-medium truncate">
              {currentUser.name}
            </div>
            <div className="text-xs text-foreground-tertiary capitalize">{currentUser.role}</div>
          </div>
        </div>
      </div>

      {/* Create Assistant Modal */}
      <CreateAssistantModal
        isOpen={showCreateAssistant}
        onClose={() => setShowCreateAssistant(false)}
        onSuccess={onAssistantCreated}
      />

      {/* Create Channel Modal */}
      <CreateChannelModal
        isOpen={showCreateChannel}
        onClose={() => setShowCreateChannel(false)}
        onSuccess={onChannelCreated}
        workspaceUsers={workspace.users}
        workspaceAssistants={workspace.assistants}
      />
    </motion.div>
  );
}
