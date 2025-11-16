import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/channels/[id]/clear
 * Clears all messages in a channel (for DM channels only)
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

  const { id: channelId } = await params;

  try {
    // Verify this is a DM channel created by the current user
    const { data: channel } = await (supabase
      .from('channels') as any)
      .select('id, is_dm, created_by')
      .eq('id', channelId)
      .single();

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    if (!channel.is_dm) {
      return NextResponse.json(
        { error: 'Can only clear history for DM channels' },
        { status: 400 }
      );
    }

    if (channel.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only clear your own DM history' },
        { status: 403 }
      );
    }

    // Delete all messages in this channel
    const { error: deleteError } = await (supabase
      .from('messages') as any)
      .delete()
      .eq('channel_id', channelId);

    if (deleteError) {
      console.error('Error clearing channel history:', deleteError);
      throw deleteError;
    }

    console.log('✓ Cleared history for channel:', channelId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing channel history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear history' },
      { status: 500 }
    );
  }
}
