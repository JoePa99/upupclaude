import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/database';

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

    // Use admin client to bypass RLS for all setup operations
    const adminSupabase = createAdminClient();

    // Check if user already has a profile and workspace
    const { data: existingProfile } = await (adminSupabase.from('users') as any)
      .select('*, workspaces(*)')
      .eq('id', user.id)
      .single();

    if (existingProfile && existingProfile.workspaces) {
      // User already has workspace, return it
      const { data: channel } = await (adminSupabase.from('channels') as any)
        .select()
        .eq('workspace_id', existingProfile.workspace_id)
        .eq('name', 'general')
        .single();

      return NextResponse.json({
        success: true,
        workspace: existingProfile.workspaces,
        channel: channel,
      });
    }

    // 1. Create workspace
    const { data: workspace, error: workspaceError } = await (adminSupabase
      .from('workspaces') as any)
      .insert({
        name: workspaceName,
        seats: seats,
        message_limit: seats * 150, // 150 messages per seat
      })
      .select()
      .single();

    if (workspaceError) throw workspaceError;

    // 2. Create or update user profile (using upsert to handle retries)
    const { error: profileError } = await (adminSupabase.from('users') as any).upsert({
      id: user.id,
      workspace_id: workspace.id,
      name: userName,
      email: user.email!,
      role: 'consultant', // First user is always consultant
    });

    if (profileError) throw profileError;

    // 3. Create default #general channel
    const { data: channel, error: channelError } = await (adminSupabase
      .from('channels') as any)
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
    const { error: memberError } = await (adminSupabase
      .from('channel_members') as any)
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
