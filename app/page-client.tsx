'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { transformMessage } from '@/lib/transformers';
import { MeshGradientBackground } from '@/components/nexus/MeshGradientBackground';
import { NexusSidebar } from '@/components/nexus/NexusSidebar';
import { ChannelHeader } from '@/components/nexus/ChannelHeader';
import { MessageStream } from '@/components/nexus/MessageStream';
import { OmniComposer } from '@/components/nexus/OmniComposer';
import { AdaptiveCanvas } from '@/components/nexus/AdaptiveCanvas';
import { Pinboard } from '@/components/nexus/Pinboard';
import { ArtifactPanel } from '@/components/nexus/ArtifactPanel';
import { EditChannelModal } from '@/components/EditChannelModal';
import { usePinStore } from '@/stores/pinStore';
import { useArtifactStore } from '@/stores/artifactStore';
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
  const [typingAssistants, setTypingAssistants] = useState<string[]>([]);
  const [canvasMessage, setCanvasMessage] = useState<MessageType | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showEditChannel, setShowEditChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Artifact library
  const { artifacts, isPanelOpen: isArtifactPanelOpen, openPanel: openArtifactPanel, closePanel: closeArtifactPanel } = useArtifactStore();

  // Artifact library
  const { artifacts, isPanelOpen: isArtifactPanelOpen, openPanel: openArtifactPanel, closePanel: closeArtifactPanel } = useArtifactStore();

  // Artifact library
  const artifactStore = useArtifactStore();
  const {
    artifacts: artifactItems,
    isPanelOpen: isArtifactPanelOpen,
    openPanel: openArtifactPanel,
    closePanel: closeArtifactPanel,
  } = artifactStore;

  // Artifact library
  const {
    artifacts: artifactItems,
    isPanelOpen: isArtifactPanelOpen,
    openPanel: openArtifactPanel,
    closePanel: closeArtifactPanel,
  } = useArtifactStore();

  // Artifact library
  const artifactStore = useArtifactStore();
  const artifactItems = artifactStore.artifacts;
  const isArtifactPanelOpen = artifactStore.isPanelOpen;
  const openArtifactPanel = artifactStore.openPanel;
  const closeArtifactPanel = artifactStore.closePanel;

  // Artifact library
  const artifactStore = useArtifactStore();
  const artifactItems = artifactStore.artifacts;
  const isArtifactPanelOpen = artifactStore.isPanelOpen;
  const openArtifactPanel = artifactStore.openPanel;
  const closeArtifactPanel = artifactStore.closePanel;

  // Artifact library
  const {
    artifacts: artifactItems,
    isPanelOpen: isArtifactPanelOpen,
    openPanel: openArtifactPanel,
    closePanel: closeArtifactPanel,
  } = useArtifactStore();

  // Artifact library
  const artifactStore = useArtifactStore();
  const artifactItems = artifactStore.artifacts;
  const isArtifactPanelOpen = artifactStore.isPanelOpen;
  const openArtifactPanel = artifactStore.openPanel;
  const closeArtifactPanel = artifactStore.closePanel;

  // Artifact library
  const {
    artifacts: artifactItems,
    isPanelOpen: isArtifactPanelOpen,
    openPanel: openArtifactPanel,
    closePanel: closeArtifactPanel,
  } = useArtifactStore();

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

  // Handle assistant creation
  const handleAssistantCreated = async () => {
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

      setCurrentChannel({
        ...currentChannel,
        assistants: transformedAssistants,
      });
    }
  };

  // Handle channel creation
  const handleChannelCreated = async () => {
    const { data: channels } = await (supabase
      .from('channels') as any)
      .select(`
        *,
        channel_assistants (
          assistant_id
        )
      `)
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: true });

    if (channels) {
      const { transformChannels } = await import('@/lib/transformers');
      const transformedChannels = transformChannels(channels, workspace.assistants);

      setWorkspace({
        ...workspace,
        channels: transformedChannels,
      });
    }
  };

  // Handle channel update
  const handleEditChannel = () => {
    setShowEditChannel(true);
  };

  const handleChannelUpdated = async () => {
    await handleChannelCreated();

    const { data: updatedChannel } = await (supabase
      .from('channels') as any)
      .select(`
        *,
        channel_assistants (
          assistant_id
        )
      `)
      .eq('id', currentChannel.id)
      .single();

    if (updatedChannel) {
      const { transformChannels } = await import('@/lib/transformers');
      const [transformed] = transformChannels([updatedChannel], workspace.assistants);
      setCurrentChannel(transformed);
    }
  };

  // Handle channel deletion
  const handleDeleteChannel = async () => {
    if (!confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/channels/${currentChannel.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete channel');
      }

      await handleChannelCreated();

      const firstChannel = workspace.channels.find(c => c.id !== currentChannel.id);
      if (firstChannel) {
        setCurrentChannel(firstChannel);
      }
    } catch (error: any) {
      console.error('Error deleting channel:', error);
      alert(error.message || 'Failed to delete channel');
    }
  };

  const handleClearHistory = async () => {
    if (!currentChannel.isDm) return;

    const confirmed = confirm(
      'Are you sure you want to clear this conversation history? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/channels/${currentChannel.id}/clear`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      setMessages((prev) => prev.filter((m) => m.channelId !== currentChannel.id));
    } catch (error: any) {
      console.error('Error clearing history:', error);
      alert(error.message || 'Failed to clear history');
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

      if (!response.ok) {
        // Remove typing indicators on error
        setTypingAssistants((prev) => prev.filter((id) => !mentions.includes(id)));
        throw new Error(data.error || 'Failed to send message');
      }

      // If AI responses were returned, add them to state immediately
      if (data.aiResponses && data.aiResponses.length > 0) {
        const transformedAiResponses = data.aiResponses.map((msg: any) => transformMessage(msg));
        setMessages((prev) => [...prev, ...transformedAiResponses]);

        // Remove typing indicators for assistants that responded
        const respondedAssistantIds = data.aiResponses.map((msg: any) => msg.author_id);
        setTypingAssistants((prev) => prev.filter((id) => !respondedAssistantIds.includes(id)));
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
          onAssistantCreated={handleAssistantCreated}
          onChannelCreated={handleChannelCreated}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative">
          {/* Channel Header */}
          <ChannelHeader
            channel={currentChannel}
            onClearHistory={handleClearHistory}
            onEditChannel={handleEditChannel}
            onDeleteChannel={handleDeleteChannel}
            onTogglePinboard={togglePinboard}
            pinCount={pins.length}
            onToggleArtifacts={() => {
              if (isArtifactPanelOpen) {
                closeArtifactPanel();
              } else {
                openArtifactPanel();
              }
            }}
            artifactCount={artifactItems.length}
          />

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto pb-32">
            <MessageStream
              messages={channelMessages}
              onArtifactOpen={handleArtifactOpen}
            />

            {/* Typing Indicators */}
            {typingAssistants.length > 0 && (
              <div className="px-8 py-4 space-y-4">
                {typingAssistants.map((assistantId) => {
                  const assistant = workspace.assistants.find((a) => a.id === assistantId);
                  if (!assistant) return null;

                  return (
                    <div key={`typing-${assistantId}`} className="flex items-start gap-4 opacity-70">
                      <div className="w-10 h-10 rounded-full bg-luminous-accent-purple/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-extrabold text-luminous-accent-purple">
                          {assistant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-luminous-text-primary text-sm">
                            {assistant.name}
                          </span>
                          <span className="text-xs text-luminous-text-tertiary">
                            {assistant.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-luminous-accent-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-luminous-accent-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-luminous-accent-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-xs text-luminous-text-tertiary font-medium ml-1">thinking...</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Omni-Composer - Floating Pill Input */}
        <OmniComposer
          assistants={workspace.assistants}
          onSendMessage={handleSendMessage}
          disabled={sending}
        />

        {/* Adaptive Canvas - Slide-out Panel */}
        <AdaptiveCanvas
          isOpen={showCanvas}
          message={canvasMessage}
          onClose={() => setShowCanvas(false)}
        />

        {/* Pinboard - Slide-out Panel */}
        <Pinboard
          isOpen={isPinboardOpen}
          onClose={closePinboard}
          pins={pins}
          onDeletePin={removePin}
          onPinClick={(pin) => {
            // TODO: Jump to original message or show in context
            console.log('Pin clicked:', pin);
          }}
        />

        {/* Artifact Library - Slide-out Panel */}
        <ArtifactPanel isOpen={isArtifactPanelOpen} onClose={closeArtifactPanel} />
      </div>

      {/* Edit Channel Modal */}
      <EditChannelModal
        isOpen={showEditChannel}
        onClose={() => setShowEditChannel(false)}
        onSuccess={handleChannelUpdated}
        channel={currentChannel}
      />
    </>
  );
}
