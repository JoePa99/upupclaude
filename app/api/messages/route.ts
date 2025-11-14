import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json(
        { error: 'Channel ID is required' },
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

    // Fetch messages
    const { data: messages, error: messagesError } = await (supabase
      .from('messages') as any)
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Fetch author info for each message
    const messagesWithAuthors = await Promise.all(
      (messages || []).map(async (msg: any) => {
        const table = msg.author_type === 'human' ? 'users' : 'assistants';
        const { data: author } = await (supabase
          .from(table) as any)
          .select('id, name, email, avatar_url, role')
          .eq('id', msg.author_id)
          .single();

        return {
          ...msg,
          author: author || { id: msg.author_id, name: 'Unknown', email: '', role: 'member' },
        };
      })
    );

    return NextResponse.json({
      success: true,
      messages: messagesWithAuthors,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
