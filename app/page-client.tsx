'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { transformMessage } from '@/lib/transformers';
import { Sidebar } from '@/components/Sidebar';
import { ChannelHeader } from '@/components/ChannelHeader';
import { Message } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import type { Channel, Message as MessageType, Workspace } from '@/types';

interface PageClientProps {
  initialWorkspace: Workspace;
  initialChannel: Channel;
  initialMessages: MessageType[];
  currentUserId: string;
}

export function PageClient({
  initialWorkspace,
  initialChannel,
  initialMessages,
  currentUserId,
}: PageClientProps) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace);
  const [currentChannel, setCurrentChannel] = useState<Channel>(initialChannel);
  const [messages, setMessages] = useState<MessageType[]>(initialMessages);
  const [sending, setSending] = useState(false);
  const [typingAssistants, setTypingAssistants] = useState<string[]>([]);
  const supabase = createClient();

  // Get current user from workspace
  const currentUser = workspace.users.find(u => u.id === currentUserId) || workspace.users[0];

  // Handle assistant creation
  const handleAssistantCreated = async () => {
    // Refresh assistants list
    const { data: assistants } = await (supabase
      .from('assistants') as any)
      .select('*')
      .eq('workspace_id', workspace.id);

    if (assistants) {
      const { transformAssistants } = await import('@/lib/transformers');
      const transformedAssistants = transformAssistants(assistants);

      setWorkspace({
        ...workspace,
        assistants: transformedAssistants,
      });

      // Also update current channel's assistants
      setCurrentChannel({
        ...currentChannel,
        assistants: transformedAssistants,
      });
    }
  };

  // Set up Realtime subscription for new messages
  useEffect(() => {
    console.log('Setting up Realtime subscription for channel:', currentChannel.id);

    // Use a unique channel name to avoid conflicts between tabs
    const channelName = `messages:${currentChannel.id}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${currentChannel.id}`,
        },
        async (payload) => {
          console.log('Realtime message received:', payload);

          // Fetch the complete message
          const { data: newMessage } = await (supabase
            .from('messages') as any)
            .select('*')
            .eq('id', payload.new.id)
            .single();

          console.log('Fetched complete message:', newMessage);

          if (newMessage) {
            // Fetch author info separately
            const table = newMessage.author_type === 'human' ? 'users' : 'assistants';
            const { data: author } = await (supabase
              .from(table) as any)
              .select('id, name, email, avatar_url, role')
              .eq('id', newMessage.author_id)
              .single();

            console.log('Fetched author:', author);

            const completeMessage = {
              ...newMessage,
              author: author || { id: newMessage.author_id, name: 'Unknown', email: '', role: 'member' },
            };

            const transformed = transformMessage(completeMessage);
            console.log('Transformed message:', transformed);

            setMessages((prev) => {
              console.log('Adding message to state. Current count:', prev.length);
              return [...prev, transformed];
            });

            // If this is an assistant message, remove from typing indicators
            if (newMessage.author_type === 'assistant') {
              setTypingAssistants((prev) => prev.filter((id) => id !== newMessage.author_id));
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Cleaning up Realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentChannel.id, supabase]);

  const channelMessages = messages.filter(
    (m) => m.channelId === currentChannel.id
  );

  const handleSendMessage = async (content: string, mentions: string[]) => {
    if (sending) return;

    setSending(true);
    try {
      console.log('Sending message:', { channelId: currentChannel.id, content, mentions });

      // Add typing indicators for mentioned assistants
      if (mentions && mentions.length > 0) {
        setTypingAssistants((prev) => [...new Set([...prev, ...mentions])]);
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: currentChannel.id,
          content,
          mentions,
        }),
      });

      const data = await response.json();
      console.log('Send response:', data);

      if (!response.ok) {
        // Remove typing indicators on error
        setTypingAssistants((prev) => prev.filter((id) => !mentions.includes(id)));
        throw new Error(data.error || 'Failed to send message');
      }

      // Message will be added via Realtime subscription
      // AI responses (if any) will also appear via Realtime
      console.log('Message sent successfully');
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar
        workspace={workspace}
        currentChannel={currentChannel}
        currentUser={currentUser}
        onChannelSelect={setCurrentChannel}
        onAssistantCreated={handleAssistantCreated}
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
                {typingAssistants.length > 0 &&
                  typingAssistants.map((assistantId) => {
                    const assistant = workspace.assistants.find((a) => a.id === assistantId);
                    if (!assistant) return null;

                    return (
                      <div key={`typing-${assistantId}`} className="px-6 py-2 opacity-70">
                        <div className="flex items-start gap-4">
                          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-accent">
                              {assistant.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-foreground text-sm">
                                {assistant.name}
                              </span>
                              <span className="text-xs text-foreground-tertiary">
                                {assistant.role}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="flex gap-1">
                                <span className="w-2 h-2 bg-foreground-secondary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-foreground-secondary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-foreground-secondary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                              <span className="text-xs text-foreground-tertiary ml-2">thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        <ChatInput
          assistants={currentChannel.assistants}
          channelName={currentChannel.name}
          isDm={currentChannel.isDm}
          dmAssistantId={currentChannel.dmAssistantId}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
