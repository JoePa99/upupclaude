'use client';

import { Channel, Assistant, Workspace } from '@/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SidebarProps {
  workspace: Workspace;
  currentChannel: Channel;
  onChannelSelect: (channel: Channel) => void;
}

export function Sidebar({
  workspace,
  currentChannel,
  onChannelSelect,
}: SidebarProps) {
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
            <button className="text-accent hover:text-accent-hover transition-colors text-sm">
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
          </div>

          <div className="space-y-1">
            {workspace.assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-tertiary transition-colors group"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg bg-ai/20 border border-ai/30 flex items-center justify-center text-ai text-sm">
                    ◆
                  </div>
                  {assistant.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-ai rounded-full border-2 border-background-secondary animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground font-medium truncate">
                    {assistant.name}
                  </div>
                  <div className="text-xs text-foreground-tertiary truncate">
                    {assistant.model.provider}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-background-tertiary transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-background text-sm font-semibold">
            SC
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-foreground font-medium truncate">
              Sarah Chen
            </div>
            <div className="text-xs text-foreground-tertiary">Admin</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
