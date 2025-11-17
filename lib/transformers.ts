import type { Message, Assistant, Channel } from '@/types';

/**
 * Transform database message format to frontend format
 */
export function transformMessage(dbMessage: any): Message {
  return {
    id: dbMessage.id,
    channelId: dbMessage.channel_id,
    authorId: dbMessage.author_id,
    authorType: dbMessage.author_type,
    author: {
      id: dbMessage.author.id,
      name: dbMessage.author.name,
      email: dbMessage.author.email,
      role: dbMessage.author.role,
      avatar: dbMessage.author.avatar_url,
    },
    content: dbMessage.content,
    mentions: dbMessage.mentions || [],
    timestamp: new Date(dbMessage.created_at),
    countsTowardLimit: dbMessage.counts_toward_limit,
  };
}

/**
 * Transform array of database messages
 */
export function transformMessages(dbMessages: any[]): Message[] {
  return dbMessages.map(transformMessage);
}

/**
 * Transform database assistant format to frontend format
 */
export function transformAssistant(dbAssistant: any): Assistant {
  return {
    id: dbAssistant.id,
    name: dbAssistant.name,
    role: dbAssistant.role,
    model: {
      provider: dbAssistant.model_provider,
      name: dbAssistant.model_name,
    },
    avatar: dbAssistant.avatar_url,
    status: dbAssistant.status || 'offline',
    enable_image_generation: dbAssistant.enable_image_generation || false,
    enable_web_search: dbAssistant.enable_web_search || false,
    enable_deep_research: dbAssistant.enable_deep_research || false,
  };
}

/**
 * Transform array of database assistants
 */
export function transformAssistants(dbAssistants: any[]): Assistant[] {
  return (dbAssistants || []).map(transformAssistant);
}

/**
 * Transform database channel format to frontend format
 */
export function transformChannel(dbChannel: any, allAssistants: Assistant[] = []): Channel {
  // Extract assistant IDs from channel_assistants junction table
  const channelAssistantIds = (dbChannel.channel_assistants || []).map((ca: any) => ca.assistant_id);

  // Filter to only include assistants that are in this channel
  const channelAssistants = allAssistants.filter(a => channelAssistantIds.includes(a.id));

  return {
    id: dbChannel.id,
    name: dbChannel.name,
    description: dbChannel.description || '',
    members: [], // Members can be populated separately if needed
    assistants: channelAssistants,
    isPrivate: dbChannel.is_private || false,
    isDm: dbChannel.is_dm || false,
    dmAssistantId: dbChannel.dm_assistant_id || undefined,
    unreadCount: 0,
  };
}

/**
 * Transform array of database channels
 */
export function transformChannels(dbChannels: any[], allAssistants: Assistant[] = []): Channel[] {
  return (dbChannels || []).map(ch => transformChannel(ch, allAssistants));
}
