import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/channels/[id]/assistants/[assistantId]
 * Removes an assistant from a channel
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assistantId: string }> }
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

  const { id, assistantId } = await params;

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

    // Remove the assistant
    const { error: deleteError } = await (supabase
      .from('channel_assistants') as any)
      .delete()
      .eq('channel_id', id)
      .eq('assistant_id', assistantId);

    if (deleteError) {
      console.error('Error removing assistant:', deleteError);
      throw deleteError;
    }

    console.log('✓ Removed assistant', assistantId, 'from channel:', id);

    return NextResponse.json({
      success: true,
      message: 'Assistant removed successfully',
    });
  } catch (error: any) {
    console.error('Error removing assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove assistant' },
      { status: 500 }
    );
  }
}
