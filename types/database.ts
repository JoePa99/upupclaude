export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string
          name: string
          seats: number
          price_per_seat: number
          message_limit: number
          messages_used: number
          billing_cycle_start: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          seats?: number
          price_per_seat?: number
          message_limit?: number
          messages_used?: number
          billing_cycle_start?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          seats?: number
          price_per_seat?: number
          message_limit?: number
          messages_used?: number
          billing_cycle_start?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          workspace_id: string
          name: string
          email: string
          role: 'consultant' | 'assistant_creator' | 'admin' | 'member'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          workspace_id: string
          name: string
          email: string
          role: 'consultant' | 'assistant_creator' | 'admin' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          email?: string
          role?: 'consultant' | 'assistant_creator' | 'admin' | 'member'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assistants: {
        Row: {
          id: string
          workspace_id: string
          name: string
          role: string
          system_prompt: string
          model_provider: 'openai' | 'anthropic' | 'google'
          model_name: string
          temperature: number
          max_tokens: number
          avatar_url: string | null
          status: 'online' | 'offline'
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          role: string
          system_prompt: string
          model_provider: 'openai' | 'anthropic' | 'google'
          model_name: string
          temperature?: number
          max_tokens?: number
          avatar_url?: string | null
          status?: 'online' | 'offline'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          role?: string
          system_prompt?: string
          model_provider?: 'openai' | 'anthropic' | 'google'
          model_name?: string
          temperature?: number
          max_tokens?: number
          avatar_url?: string | null
          status?: 'online' | 'offline'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      channels: {
        Row: {
          id: string
          workspace_id: string
          name: string
          description: string | null
          is_private: boolean
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          workspace_id: string
          name: string
          description?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          workspace_id?: string
          name?: string
          description?: string | null
          is_private?: boolean
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          author_id: string
          author_type: 'human' | 'assistant'
          content: string
          mentions: string[]
          counts_toward_limit: boolean
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          author_id: string
          author_type: 'human' | 'assistant'
          content: string
          mentions?: string[]
          counts_toward_limit?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          author_id?: string
          author_type?: 'human' | 'assistant'
          content?: string
          mentions?: string[]
          counts_toward_limit?: boolean
          created_at?: string
        }
      }
      embeddings: {
        Row: {
          id: string
          source_type: 'company_os' | 'agent_doc' | 'playbook'
          source_id: string
          workspace_id: string
          assistant_id: string | null
          content: string
          metadata: Json
          embedding: number[]
          created_at: string
        }
        Insert: {
          id?: string
          source_type: 'company_os' | 'agent_doc' | 'playbook'
          source_id: string
          workspace_id: string
          assistant_id?: string | null
          content: string
          metadata?: Json
          embedding: number[]
          created_at?: string
        }
        Update: {
          id?: string
          source_type?: 'company_os' | 'agent_doc' | 'playbook'
          source_id?: string
          workspace_id?: string
          assistant_id?: string | null
          content?: string
          metadata?: Json
          embedding?: number[]
          created_at?: string
        }
      }
    }
    Functions: {
      search_embeddings: {
        Args: {
          query_embedding: number[]
          workspace_uuid: string
          match_threshold?: number
          match_count?: number
          filter_source_type?: string | null
          filter_assistant_id?: string | null
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          source_type: string
          similarity: number
        }[]
      }
    }
  }
}
