import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/channels/[id]
 * Updates a channel
 */
export async function PUT(
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
    const { name, description, isPrivate } = body;

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
    const { data: existingChannel } = await (supabase
      .from('channels') as any)
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!existingChannel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Don't allow updating DM channels
    if (existingChannel.is_dm) {
      return NextResponse.json(
        { error: 'Cannot update DM channels' },
        { status: 400 }
      );
    }

    // Build update object (only include provided fields)
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined && name.trim() !== '') {
      updates.name = name.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (isPrivate !== undefined) {
      updates.is_private = isPrivate;
    }

    // Update the channel
    const { data: updatedChannel, error: updateError } = await (supabase
      .from('channels') as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating channel:', updateError);
      throw updateError;
    }

    console.log('✓ Updated channel:', updatedChannel.id, updatedChannel.name);

    return NextResponse.json({
      channel: {
        id: updatedChannel.id,
        name: updatedChannel.name,
        description: updatedChannel.description,
        isPrivate: updatedChannel.is_private,
        isDm: updatedChannel.is_dm,
        updatedAt: updatedChannel.updated_at,
      },
    });
  } catch (error: any) {
    console.error('Error updating channel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update channel' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/channels/[id]
 * Deletes a channel
 */
export async function DELETE(
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
    const { data: existingChannel } = await (supabase
      .from('channels') as any)
      .select('*')
      .eq('id', id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!existingChannel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Delete the channel (cascade will handle members, assistants, and messages)
    const { error: deleteError } = await (supabase
      .from('channels') as any)
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting channel:', deleteError);
      throw deleteError;
    }

    console.log('✓ Deleted channel:', id);

    return NextResponse.json({
      success: true,
      message: 'Channel deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting channel:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete channel' },
      { status: 500 }
    );
  }
}
