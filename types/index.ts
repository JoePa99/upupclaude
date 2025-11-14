export type MessageAuthorType = 'human' | 'assistant';

export type ModelProvider = 'openai' | 'anthropic' | 'google';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'consultant' | 'assistant_creator' | 'admin' | 'member';
  avatar?: string;
}

export interface Assistant {
  id: string;
  name: string;
  role: string;
  model: {
    provider: ModelProvider;
    name: string;
  };
  avatar?: string;
  status: 'online' | 'offline';
}

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  authorType: MessageAuthorType;
  author: User | Assistant;
  content: string;
  mentions: string[];
  timestamp: Date;
  countsTowardLimit: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  members: User[];
  assistants: Assistant[];
  isPrivate: boolean;
  unreadCount?: number;
}

export interface Workspace {
  id: string;
  name: string;
  channels: Channel[];
  users: User[];
  assistants: Assistant[];
}
