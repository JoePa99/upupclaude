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
export function transformChannel(dbChannel: any, members: any[] = [], assistants: Assistant[] = []): Channel {
  return {
    id: dbChannel.id,
    name: dbChannel.name,
    description: dbChannel.description || '',
    members: members,
    assistants: assistants,
    isPrivate: dbChannel.is_private || false,
    unreadCount: 0,
  };
}

/**
 * Transform array of database channels
 */
export function transformChannels(dbChannels: any[], members: any[] = [], assistants: Assistant[] = []): Channel[] {
  return (dbChannels || []).map(ch => transformChannel(ch, members, assistants));
}
