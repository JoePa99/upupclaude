'use client';

import { Channel } from '@/types';
import { motion } from 'framer-motion';

interface ChannelHeaderProps {
  channel: Channel;
}

export function ChannelHeader({ channel }: ChannelHeaderProps) {
  const memberCount = channel.members.length;
  const aiCount = channel.assistants.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b border-border bg-background px-6 py-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              {channel.isPrivate ? '🔒' : '#'} {channel.name}
            </h2>
            <div className="flex items-center gap-2">
              {channel.assistants.slice(0, 3).map((assistant) => (
                <div
                  key={assistant.id}
                  className="relative group"
                  title={assistant.name}
                >
                  <div className="w-6 h-6 rounded bg-ai/20 border border-ai/30 flex items-center justify-center text-ai text-xs">
                    ◆
                  </div>
                  {assistant.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-ai rounded-full border border-background" />
                  )}
                </div>
              ))}
              {aiCount > 3 && (
                <span className="text-xs text-foreground-tertiary">
                  +{aiCount - 3} more
                </span>
              )}
            </div>
          </div>
          {channel.description && (
            <p className="text-sm text-foreground-secondary mt-1">
              {channel.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-foreground-tertiary">
          <div className="flex items-center gap-2">
            <span>{memberCount} members</span>
            <span>·</span>
            <span>{aiCount} AI assistants</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
