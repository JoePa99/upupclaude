import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { workspaceName, userName, seats = 5 } = await request.json();

    // 1. Create workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: workspaceName,
        seats: seats,
        message_limit: seats * 150, // 150 messages per seat
      })
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // 2. Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: user.id,
      workspace_id: workspace.id,
      name: userName,
      email: user.email!,
      role: 'consultant', // First user is always consultant
    });

    if (profileError) throw profileError;

    // 3. Create default #general channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspace.id,
        name: 'general',
        description: 'General team discussions',
        is_private: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (channelError) throw channelError;

    // 4. Add user to the channel
    const { error: memberError } = await supabase
      .from('channel_members')
      .insert({
        channel_id: channel.id,
        user_id: user.id,
      });

    if (memberError) throw memberError;

    return NextResponse.json({
      success: true,
      workspace: workspace,
      channel: channel,
    });
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
