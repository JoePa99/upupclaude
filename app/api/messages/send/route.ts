import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { callOpenAI, callAnthropic, callGoogle } from '@/lib/ai-providers';

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

    // Trigger AI responses for mentioned assistants - WAIT for them to complete
    if (mentions && mentions.length > 0) {
      console.log('🔔 Processing AI responses for', mentions.length, 'assistant(s):', mentions);
      const adminSupabase = createAdminClient();

      // Process all AI responses sequentially (await each one)
      for (const assistantId of mentions) {
        try {
          console.log('  → Processing AI response for assistant:', assistantId);

          // Fetch assistant details
          const { data: assistant, error: assistantError } = await (adminSupabase
            .from('assistants') as any)
            .select('*')
            .eq('id', assistantId)
            .single();

          if (assistantError || !assistant) {
            console.error('  ✗ Assistant not found:', assistantError);
            continue;
          }

          console.log('  ✓ Assistant found:', assistant.name, 'Provider:', assistant.model_provider);

          // Call the appropriate AI provider
          console.log('  🔄 Calling', assistant.model_provider, 'API...');
          let aiResponse: string;

          if (assistant.model_provider === 'openai') {
            aiResponse = await callOpenAI(assistant, content);
          } else if (assistant.model_provider === 'anthropic') {
            aiResponse = await callAnthropic(assistant, content);
          } else if (assistant.model_provider === 'google') {
            aiResponse = await callGoogle(assistant, content);
          } else {
            console.error('  ✗ Unsupported AI provider:', assistant.model_provider);
            continue;
          }

          console.log('  ✓ AI response generated:', aiResponse.substring(0, 100) + '...');

          // Insert AI response as a message
          const { data: responseMessage, error: messageError } = await (adminSupabase
            .from('messages') as any)
            .insert({
              channel_id: channelId,
              author_id: assistantId,
              author_type: 'assistant',
              content: aiResponse,
              mentions: [],
              counts_toward_limit: false,
            })
            .select()
            .single();

          if (messageError) {
            console.error('  ✗ Failed to insert AI response:', messageError);
            continue;
          }

          console.log('  ✅ AI response saved:', responseMessage.id);
        } catch (error: any) {
          console.error(`  ✗ Error generating AI response for ${assistantId}:`, error.message);
        }
      }
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
