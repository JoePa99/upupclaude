import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/channels/dm/[assistantId]
 * Gets or creates a DM channel between the current user and an assistant
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ assistantId: string }> }
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

  const { assistantId } = await params;

  try {
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

    // Verify assistant exists and belongs to same workspace
    const { data: assistant } = await (supabase
      .from('assistants') as any)
      .select('id, name, role, model_provider, model_name, workspace_id')
      .eq('id', assistantId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!assistant) {
      return NextResponse.json(
        { error: 'Assistant not found in your workspace' },
        { status: 404 }
      );
    }

    // Check if DM channel already exists for this user-assistant pair
    const { data: existingChannels } = await (supabase
      .from('channels') as any)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_dm', true)
      .eq('dm_assistant_id', assistantId)
      .eq('created_by', user.id);

    if (existingChannels && existingChannels.length > 0) {
      // DM channel already exists, format it properly
      const existingChannel = existingChannels[0];

      // Get current user info
      const { data: currentUser } = await (supabase
        .from('users') as any)
        .select('id, name, email, avatar_url, role')
        .eq('id', user.id)
        .single();

      const completeChannel = {
        id: existingChannel.id,
        name: existingChannel.name,
        description: existingChannel.description,
        isPrivate: existingChannel.is_private,
        members: currentUser ? [currentUser] : [],
        assistants: [{
          id: assistant.id,
          name: assistant.name,
          role: assistant.role,
          model: {
            provider: assistant.model_provider,
            name: assistant.model_name,
          },
          status: 'online',
        }],
      };

      return NextResponse.json({
        channel: completeChannel,
        created: false,
      });
    }

    // Create new DM channel
    const { data: newChannel, error: channelError } = await (supabase
      .from('channels') as any)
      .insert({
        workspace_id: workspaceId,
        name: `DM: ${assistant.name}`,
        description: `Direct message with ${assistant.name}`,
        is_private: true,
        is_dm: true,
        dm_assistant_id: assistantId,
        created_by: user.id,
      })
      .select()
      .single();

    if (channelError) {
      console.error('Error creating DM channel:', channelError);
      throw channelError;
    }

    // Add current user as channel member
    await (supabase
      .from('channel_members') as any)
      .insert({
        channel_id: newChannel.id,
        user_id: user.id,
      });

    // Add assistant to channel
    await (supabase
      .from('channel_assistants') as any)
      .insert({
        channel_id: newChannel.id,
        assistant_id: assistantId,
      });

    console.log('✓ Created DM channel:', newChannel.id, 'for assistant:', assistantId);

    // Get current user info
    const { data: currentUser } = await (supabase
      .from('users') as any)
      .select('id, name, email, avatar_url, role')
      .eq('id', user.id)
      .single();

    // Format channel properly
    const completeChannel = {
      id: newChannel.id,
      name: newChannel.name,
      description: newChannel.description,
      isPrivate: newChannel.is_private,
      members: currentUser ? [currentUser] : [],
      assistants: [{
        id: assistant.id,
        name: assistant.name,
        role: assistant.role,
        model: {
          provider: assistant.model_provider,
          name: assistant.model_name,
        },
        status: 'online',
      }],
    };

    return NextResponse.json({
      channel: completeChannel,
      created: true,
    });
  } catch (error: any) {
    console.error('Error in DM channel creation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create DM channel' },
      { status: 500 }
    );
  }
}
