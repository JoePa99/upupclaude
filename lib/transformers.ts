import type { Message } from '@/types';

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
