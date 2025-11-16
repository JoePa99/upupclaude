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
  enable_image_generation?: boolean;
  enable_web_search?: boolean;
  enable_deep_research?: boolean;
}

export type SlashCommand = 'image' | 'search' | 'research';

export interface Message {
  id: string;
  channelId: string;
  authorId: string;
  authorType: MessageAuthorType;
  author: User | Assistant;
  content: string;
  mentions: string[];
  command?: SlashCommand;
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
  isDm?: boolean;
  dmAssistantId?: string;
  unreadCount?: number;
}

export interface Workspace {
  id: string;
  name: string;
  channels: Channel[];
  users: User[];
  assistants: Assistant[];
}
