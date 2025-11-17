import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/channels/[id]/members
 * Adds members to a channel
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: userData } = await (supabase
      .from('users') as any)
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const workspaceId = userData.workspace_id;

    // Verify channel exists and belongs to user's workspace
    const { data: channel } = await (supabase
      .from('channels') as any)
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Verify all users exist in the workspace
    const { data: usersToAdd } = await (supabase
      .from('users') as any)
      .select('id')
      .eq('workspace_id', workspaceId)
      .in('id', userIds);

    if (!usersToAdd || usersToAdd.length !== userIds.length) {
      return NextResponse.json(
        { error: 'Some users not found in workspace' },
        { status: 400 }
      );
    }

    // Get existing members
    const { data: existingMembers } = await (supabase
      .from('channel_members') as any)
      .select('user_id')
      .eq('channel_id', id);

    const existingMemberIds = new Set(
      existingMembers?.map((m: any) => m.user_id) || []
    );

    // Filter out users who are already members
    const newMemberIds = userIds.filter((userId) => !existingMemberIds.has(userId));

    if (newMemberIds.length === 0) {
      return NextResponse.json({
        message: 'All users are already members',
        added: 0,
      });
    }

    // Add new members
    const membersToInsert = newMemberIds.map((userId) => ({
      channel_id: id,
      user_id: userId,
    }));

    const { error: insertError } = await (supabase
      .from('channel_members') as any)
      .insert(membersToInsert);

    if (insertError) {
      console.error('Error adding members:', insertError);
      throw insertError;
    }

    console.log('✓ Added', newMemberIds.length, 'members to channel:', id);

    return NextResponse.json({
      success: true,
      added: newMemberIds.length,
    });
  } catch (error: any) {
    console.error('Error adding members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add members' },
      { status: 500 }
    );
  }
}
