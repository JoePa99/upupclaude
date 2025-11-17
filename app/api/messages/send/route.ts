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
    const { channelId, content, mentions, command } = await request.json();

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

    // Trigger AI responses via Supabase Edge Function
    if (mentions && mentions.length > 0) {
      console.log('🔔 Triggering', mentions.length, 'AI response(s) via Edge Function');

      // Call Edge Function for each mentioned assistant and await to catch errors
      const edgeFunctionResults = await Promise.allSettled(
        mentions.map(async (assistantId: string) => {
          try {
            console.log('  → Invoking Edge Function for assistant:', assistantId);
            const result = await supabase.functions.invoke('ai-respond', {
              body: {
                assistantId,
                channelId,
                userMessage: content,
                command,
              },
            });

            if (result.error) {
              console.error('  ✗ Edge Function error for', assistantId, ':', result.error);
              return { assistantId, success: false, error: result.error };
            } else {
              console.log('  ✓ Edge Function succeeded for', assistantId);
              return { assistantId, success: true, data: result.data };
            }
          } catch (err) {
            console.error('  ✗ Failed to invoke Edge Function for', assistantId, ':', err);
            return { assistantId, success: false, error: err };
          }
        })
      );

      console.log('Edge Function invocation results:', edgeFunctionResults);

      // Collect successful AI response messages to return to client
      const aiResponses = [];
      for (const result of edgeFunctionResults) {
        if (result.status === 'fulfilled' && result.value.success && result.value.data?.message) {
          const aiMessage = result.value.data.message;

          // Fetch assistant info for the response
          const { data: assistant } = await (supabase
            .from('assistants') as any)
            .select('id, name, email, avatar_url, role')
            .eq('id', aiMessage.author_id)
            .single();

          aiResponses.push({
            ...aiMessage,
            author: assistant || { id: aiMessage.author_id, name: 'Unknown', email: '', role: 'assistant' },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: completeMessage,
        aiResponses: aiResponses.length > 0 ? aiResponses : undefined,
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
