import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageClient } from './page-client';
import { transformMessages, transformAssistants, transformChannels } from '@/lib/transformers';

export default async function Home() {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to signin
  if (!user) {
    redirect('/auth/signin');
  }

  // For now, use mock data until we have a populated database
  // In production, fetch real data from Supabase

  // Check if user has a workspace profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // If no profile, redirect to setup
  if (!userProfile) {
    redirect('/setup');
  }

  // Fetch workspace data
  const { data: workspace } = await (supabase
    .from('workspaces') as any)
    .select('*')
    .eq('id', userProfile.workspace_id)
    .single();

  if (!workspace) {
    redirect('/setup');
  }

  // Fetch user's channels
  const { data: channelMemberships } = await (supabase
    .from('channel_members') as any)
    .select(
      `
      channel_id,
      channels (
        id,
        name,
        description,
        is_private,
        created_at
      )
    `
    )
    .eq('user_id', user.id);

  const channels = (channelMemberships || [])
    .map((m: any) => m.channels)
    .filter((c: any) => c !== null);

  if (!channels || channels.length === 0) {
    // No channels available - shouldn't happen after setup, but handle it
    redirect('/setup');
  }

  const firstChannel = channels[0];

  if (!firstChannel) {
    redirect('/setup');
  }

  // Fetch assistants in the workspace
  const { data: assistants } = await (supabase
    .from('assistants') as any)
    .select('*')
    .eq('workspace_id', userProfile.workspace_id);

  // Transform assistants and channels to frontend format
  const transformedAssistants = transformAssistants(assistants || []);
  const transformedChannels = transformChannels(channels, [userProfile], transformedAssistants);

  // Fetch messages for the first channel
  const { data: messages } = await (supabase
    .from('messages') as any)
    .select(
      `
      *,
      author:users!messages_author_id_fkey (
        id,
        name,
        email,
        avatar_url,
        role
      )
    `
    )
    .eq('channel_id', firstChannel.id)
    .order('created_at', { ascending: true });

  return (
    <PageClient
      initialWorkspace={{
        id: workspace.id,
        name: workspace.name,
        users: [userProfile],
        channels: transformedChannels,
        assistants: transformedAssistants,
      }}
      initialChannel={transformedChannels[0]}
      initialMessages={transformMessages(messages || [])}
      currentUserId={user.id}
    />
  );
}
