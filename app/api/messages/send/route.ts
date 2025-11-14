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
    const { channelId, content, mentions } = await request.json();

    if (!channelId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Channel ID and content are required' },
        { status: 400 }
      );
    }

    // Verify user has access to this channel
    const { data: membership } = await (supabase
      .from('channel_members') as any)
      .select('*')
      .eq('channel_id', channelId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this channel' },
        { status: 403 }
      );
    }

    // Insert message
    const { data: message, error: messageError } = await (supabase
      .from('messages') as any)
      .insert({
        channel_id: channelId,
        author_id: user.id,
        author_type: 'human',
        content: content.trim(),
        mentions: mentions || [],
        counts_toward_limit: mentions && mentions.length > 0,
      })
      .select(
        `
        *,
        author:users!messages_author_id_fkey (
          id,
          name,
          email,
          avatar_url
        )
      `
      )
      .single();

    if (messageError) throw messageError;

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
