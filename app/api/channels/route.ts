import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/channels
 * Creates a new channel
 */
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
    const body = await request.json();
    const { name, description, isPrivate, memberIds, assistantIds } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Channel name is required' },
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

    // Create the channel
    const { data: newChannel, error: channelError } = await (supabase
      .from('channels') as any)
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        description: description?.trim() || null,
        is_private: isPrivate || false,
        is_dm: false,
        created_by: user.id,
      })
      .select()
      .single();

    if (channelError) {
      console.error('Error creating channel:', channelError);
      throw channelError;
    }

    // Add creator as a member
    await (supabase
      .from('channel_members') as any)
      .insert({
        channel_id: newChannel.id,
        user_id: user.id,
      });

    // Add additional members if specified
    if (memberIds && Array.isArray(memberIds) && memberIds.length > 0) {
      const membersToAdd = memberIds
        .filter((id: string) => id !== user.id) // Don't duplicate creator
        .map((userId: string) => ({
          channel_id: newChannel.id,
          user_id: userId,
        }));

      if (membersToAdd.length > 0) {
        await (supabase
          .from('channel_members') as any)
          .insert(membersToAdd);
      }
    }

    // Add assistants if specified
    if (assistantIds && Array.isArray(assistantIds) && assistantIds.length > 0) {
      const assistantsToAdd = assistantIds.map((assistantId: string) => ({
        channel_id: newChannel.id,
        assistant_id: assistantId,
      }));

      await (supabase
        .from('channel_assistants') as any)
        .insert(assistantsToAdd);
    }

    console.log('✓ Created channel:', newChannel.id, newChannel.name);

    return NextResponse.json({
      channel: {
        id: newChannel.id,
        name: newChannel.name,
        description: newChannel.description,
        isPrivate: newChannel.is_private,
        isDm: false,
        createdAt: newChannel.created_at,
        updatedAt: newChannel.updated_at,
      },
      created: true,
    });
  } catch (error: any) {
    console.error('Error creating channel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create channel' },
      { status: 500 }
    );
  }
}
