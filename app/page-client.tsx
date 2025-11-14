'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChannelHeader } from '@/components/ChannelHeader';
import { Message } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import type { Channel, Message as MessageType, Workspace } from '@/types';

interface PageClientProps {
  initialWorkspace: Workspace;
  initialChannel: Channel;
  initialMessages: MessageType[];
}

export function PageClient({
  initialWorkspace,
  initialChannel,
  initialMessages,
}: PageClientProps) {
  const [currentChannel, setCurrentChannel] = useState<Channel>(initialChannel);
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);

  const channelMessages = messages.filter(
    (m) => m.channelId === currentChannel.id
  );

  const handleSendMessage = async (content: string, mentions: string[]) => {
    // In production, this would call an API route
    // For now, just add to local state
    const newMessage: MessageType = {
      id: `m${Date.now()}`,
      channelId: currentChannel.id,
      authorId: initialWorkspace.users[0].id,
      authorType: 'human',
      author: initialWorkspace.users[0],
      content,
      mentions,
      timestamp: new Date(),
      countsTowardLimit: mentions.length > 0,
    };

    setMessages([...messages, newMessage]);

    // TODO: Implement AI response via API
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar
        workspace={initialWorkspace}
        currentChannel={currentChannel}
        onChannelSelect={setCurrentChannel}
      />

      <div className="flex-1 flex flex-col relative z-10">
        <ChannelHeader channel={currentChannel} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {channelMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-20">💬</div>
                  <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
                    No messages yet
                  </h3>
                  <p className="text-foreground-secondary">
                    Start a conversation by mentioning an AI assistant
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                {channelMessages.map((message, index) => (
                  <Message key={message.id} message={message} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>

        <ChatInput
          assistants={currentChannel.assistants}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
