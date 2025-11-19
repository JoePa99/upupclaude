'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { transformMessage } from '@/lib/transformers';
import { MeshGradientBackground } from '@/components/nexus/MeshGradientBackground';
import { NexusSidebar } from '@/components/nexus/NexusSidebar';
import { MessageStream } from '@/components/nexus/MessageStream';
import { OmniComposer } from '@/components/nexus/OmniComposer';
import { AdaptiveCanvas } from '@/components/nexus/AdaptiveCanvas';
import type { Channel, Message as MessageType, Workspace } from '@/types';

interface PageClientProps {
  initialWorkspace: Workspace;
  initialChannel: Channel;
  initialMessages: MessageType[];
  currentUserId: string;
}

/**
 * NEXUS OS - Main Application Layout
 * Luminous Glass aesthetic with Sidebar, Stream, Omni-Composer, and Adaptive Canvas
 */
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
  const [canvasMessage, setCanvasMessage] = useState<MessageType | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Get current user from workspace
  const currentUser = workspace.users.find(u => u.id === currentUserId) || workspace.users[0];

  // Scroll to bottom when messages change or channel changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentChannel.id]);

  // Load messages for a specific channel
  const loadChannelMessages = async (channelId: string) => {
    try {
      const { data: channelMessages } = await (supabase
        .from('messages') as any)
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (!channelMessages) return;

      // Fetch author info for each message
      const messagesWithAuthors = await Promise.all(
        channelMessages.map(async (msg: any) => {
          const table = msg.author_type === 'human' ? 'users' : 'assistants';
          const selectFields = msg.author_type === 'human'
            ? 'id, name, email, avatar_url, role'
            : 'id, name, avatar_url, role';
          const { data: author } = await (supabase
            .from(table) as any)
            .select(selectFields)
            .eq('id', msg.author_id)
            .single();

          return {
            ...msg,
            author: author || { id: msg.author_id, name: 'Unknown', email: '', role: 'member' },
          };
        })
      );

      const transformed = messagesWithAuthors.map((msg) => transformMessage(msg));

      // Replace messages for this channel
      setMessages((prev) => [
        ...prev.filter((m) => m.channelId !== channelId),
        ...transformed,
      ]);
    } catch (error) {
      console.error('Error loading channel messages:', error);
    }
  };


  // Load messages when channel changes
  useEffect(() => {
    // Check if we have messages for this channel
    const hasMessages = messages.some((m) => m.channelId === currentChannel.id);
    if (!hasMessages && currentChannel.id) {
      loadChannelMessages(currentChannel.id);
    }
  }, [currentChannel.id]);

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
            const selectFields = newMessage.author_type === 'human'
              ? 'id, name, email, avatar_url, role'
              : 'id, name, avatar_url, role';
            const { data: author } = await (supabase
              .from(table) as any)
              .select(selectFields)
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
              // Check if message already exists (to avoid duplicates)
              const exists = prev.some((m) => m.id === transformed.id);
              if (exists) {
                console.log('Message already exists, skipping duplicate:', transformed.id);
                return prev;
              }
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

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // If AI responses were returned, add them to state immediately
      if (data.aiResponses && data.aiResponses.length > 0) {
        const transformedAiResponses = data.aiResponses.map((msg: any) => transformMessage(msg));
        setMessages((prev) => [...prev, ...transformedAiResponses]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleArtifactOpen = (message: MessageType) => {
    setCanvasMessage(message);
    setShowCanvas(true);
  };

  return (
    <>
      {/* Mesh Gradient Background */}
      <MeshGradientBackground />

      {/* Main Layout */}
      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Sidebar - Detached Glass Panel */}
        <NexusSidebar
          workspace={workspace}
          currentChannel={currentChannel}
          currentUser={currentUser}
          onChannelSelect={setCurrentChannel}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative pb-32">
          {/* Message Stream */}
          <MessageStream
            messages={channelMessages}
            onArtifactOpen={handleArtifactOpen}
          />

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Omni-Composer - Floating Pill Input */}
        <OmniComposer
          assistants={currentChannel.assistants}
          onSendMessage={handleSendMessage}
          disabled={sending}
        />

        {/* Adaptive Canvas - Slide-out Panel */}
        <AdaptiveCanvas
          isOpen={showCanvas}
          message={canvasMessage}
          onClose={() => setShowCanvas(false)}
        />
      </div>
    </>
  );
}
