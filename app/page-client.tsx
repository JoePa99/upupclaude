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
        throw new Error(data.error || 'Failed to send message');
      }

      // Message will be added via Realtime subscription
      // No need to manually add to state
      console.log('Message sent successfully, waiting for Realtime update');

      // Check if AI responses were triggered
      if (data.aiResponsesTriggered > 0) {
        console.log(`🤖 ${data.aiResponsesTriggered} AI response(s) triggered - watch for them to appear via Realtime`);
      }
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
              </div>
            )}
          </div>
        </div>

        <ChatInput
          assistants={currentChannel.assistants}
          channelName={currentChannel.name}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
