import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database';

type Workspace = Database['public']['Tables']['workspaces']['Row'];
type User = Database['public']['Tables']['users']['Row'];
type Channel = Database['public']['Tables']['channels']['Row'];
type Assistant = Database['public']['Tables']['assistants']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return user;
}

export async function getWorkspace(workspaceId: string) {
  const supabase = await createClient();

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  return workspace;
}

export async function getWorkspaceChannels(workspaceId: string) {
  const supabase = await createClient();

  const { data: channels } = await supabase
    .from('channels')
    .select(
      `
      *,
      channel_members (
        user_id
      ),
      channel_assistants (
        assistant_id
      )
    `
    )
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  return channels || [];
}

export async function getWorkspaceAssistants(workspaceId: string) {
  const supabase = await createClient();

  const { data: assistants } = await supabase
    .from('assistants')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  return assistants || [];
}

export async function getWorkspaceUsers(workspaceId: string) {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  return users || [];
}

export async function getChannelMessages(channelId: string, limit = 50) {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: true })
    .limit(limit);

  return messages || [];
}

export async function sendMessage(
  channelId: string,
  authorId: string,
  authorType: 'human' | 'assistant',
  content: string,
  mentions: string[] = []
) {
  const supabase = await createClient();

  const countsTowardLimit = authorType === 'human' && mentions.length > 0;

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      channel_id: channelId,
      author_id: authorId,
      author_type: authorType,
      content,
      mentions,
      counts_toward_limit: countsTowardLimit,
    })
    .select()
    .single();

  if (error) throw error;

  return message;
}
