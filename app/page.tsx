'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChannelHeader } from '@/components/ChannelHeader';
import { Message } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import {
  mockWorkspace,
  mockChannels,
  mockMessages,
} from '@/lib/mock-data';
import { Channel, Message as MessageType } from '@/types';

export default function Home() {
  const [currentChannel, setCurrentChannel] = useState<Channel>(
    mockChannels[0]
  );
  const [messages, setMessages] = useState<MessageType[]>(mockMessages);

  const channelMessages = messages.filter(
    (m) => m.channelId === currentChannel.id
  );

  const handleSendMessage = (content: string, mentions: string[]) => {
    const newMessage: MessageType = {
      id: `m${messages.length + 1}`,
      channelId: currentChannel.id,
      authorId: 'u1',
      authorType: 'human',
      author: mockWorkspace.users[0],
      content,
      mentions,
      timestamp: new Date(),
      countsTowardLimit: mentions.length > 0,
    };

    setMessages([...messages, newMessage]);

    // Simulate AI response if there are mentions
    if (mentions.length > 0) {
      setTimeout(() => {
        const assistant = mockWorkspace.assistants.find((a) =>
          mentions.includes(a.id)
        );
        if (assistant) {
          const aiResponse: MessageType = {
            id: `m${messages.length + 2}`,
            channelId: currentChannel.id,
            authorId: assistant.id,
            authorType: 'assistant',
            author: assistant,
            content:
              "I'm analyzing your question using the CompanyOS knowledge and relevant playbooks. In a real implementation, this would be a context-rich response based on retrieved knowledge chunks.\n\n**Analysis**: [Context-based insights would appear here]\n\n**Recommendations**: [Actionable next steps]\n\nWould you like me to dive deeper into any specific aspect?",
            mentions: [],
            timestamp: new Date(Date.now() + 2000),
            countsTowardLimit: false,
          };

          setMessages((prev) => [...prev, aiResponse]);
        }
      }, 2000);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Sidebar */}
      <Sidebar
        workspace={mockWorkspace}
        currentChannel={currentChannel}
        onChannelSelect={setCurrentChannel}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Channel header */}
        <ChannelHeader channel={currentChannel} />

        {/* Messages */}
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

        {/* Chat input */}
        <ChatInput
          assistants={currentChannel.assistants}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
