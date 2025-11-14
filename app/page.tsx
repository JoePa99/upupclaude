import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageClient } from './page-client';
import { mockWorkspace, mockChannels, mockMessages } from '@/lib/mock-data';

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

  // TODO: Fetch real data from Supabase
  // const workspace = await getWorkspace(userProfile.workspace_id);
  // const channels = await getWorkspaceChannels(userProfile.workspace_id);
  // const messages = await getChannelMessages(channels[0].id);

  // For now, use mock data
  return (
    <PageClient
      initialWorkspace={mockWorkspace}
      initialChannel={mockChannels[0]}
      initialMessages={mockMessages}
    />
  );
}
