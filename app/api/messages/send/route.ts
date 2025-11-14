import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Force this route to use Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
      .select()
      .single();

    if (messageError) throw messageError;

    // Fetch author info separately (since author_id can reference users OR assistants)
    const { data: author } = await (supabase
      .from('users') as any)
      .select('id, name, email, avatar_url, role')
      .eq('id', user.id)
      .single();

    // Combine message with author info
    const completeMessage = {
      ...message,
      author: author,
    };

    // Trigger AI responses via Supabase Edge Function (fire-and-forget)
    if (mentions && mentions.length > 0) {
      console.log('🔔 Triggering', mentions.length, 'AI response(s) via Edge Function');

      // Call Edge Function for each mentioned assistant (don't await - let it run in background)
      mentions.forEach((assistantId: string) => {
        supabase.functions.invoke('ai-respond', {
          body: {
            assistantId,
            channelId,
            userMessage: content,
          },
        }).then(result => {
          if (result.error) {
            console.error('  ✗ Edge Function error for', assistantId, ':', result.error);
          } else {
            console.log('  ✓ Edge Function triggered for', assistantId);
          }
        }).catch(err => {
          console.error('  ✗ Failed to invoke Edge Function:', err);
        });
      });
    }

    return NextResponse.json({
      success: true,
      message: completeMessage,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
