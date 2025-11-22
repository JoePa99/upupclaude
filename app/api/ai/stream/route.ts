import { createAdminClient } from '@/lib/supabase/admin';
import { streamOpenAI, streamAnthropic, streamGoogle } from '@/lib/ai-providers-stream';

// Force this route to use Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const adminSupabase = createAdminClient();

  try {
    const { assistantId, channelId, userMessage } = await request.json();

    console.log('🌊 Streaming AI response request:', { assistantId, channelId });

    // Fetch assistant details
    const { data: assistant, error: assistantError } = await (adminSupabase
      .from('assistants') as any)
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      console.error('L Assistant not found:', assistantError);
      return new Response('Assistant not found', { status: 404 });
    }

    console.log(' Assistant found:', assistant.name, 'Provider:', assistant.model_provider);

    // Fetch recent conversation history (last 20 messages to provide context)
    const { data: recentMessages, error: messagesError } = await (adminSupabase
      .from('messages') as any)
      .select('content, author_type, author_id')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (messagesError) {
      console.error('⚠️ Failed to fetch conversation history:', messagesError);
    }

    // Build conversation history in reverse chronological order (oldest first)
    const conversationHistory = (recentMessages || []).reverse().map((msg: any) => ({
      role: msg.author_type === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    console.log('📚 Loaded', conversationHistory.length, 'messages of conversation history');

    // Create a TransformStream for Server-Sent Events
    const encoder = new TextEncoder();
    let fullText = '';
    let messageId: string | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: any) => {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        };

        try {
          // Create initial message in database
          const { data: initialMessage, error: messageError } = await (adminSupabase
            .from('messages') as any)
            .insert({
              channel_id: channelId,
              author_id: assistantId,
              author_type: 'assistant',
              content: '', // Start with empty content
              mentions: [],
              counts_toward_limit: false,
            })
            .select()
            .single();

          if (messageError) {
            throw messageError;
          }

          messageId = initialMessage.id;
          sendEvent('message_created', { messageId });

          // Stream AI response
          const callbacks = {
            onToken: (token: string) => {
              fullText += token;
              console.log('🔤 Sending token to client:', token.substring(0, 50));
              sendEvent('token', { token, messageId });
            },
            onComplete: async (text: string) => {
              console.log('✅ Stream complete, total length:', text.length);
              // Update message with complete content
              const { error: updateError } = await (adminSupabase
                .from('messages') as any)
                .update({ content: text })
                .eq('id', messageId);

              if (updateError) {
                console.error('Failed to update message:', updateError);
              }

              sendEvent('complete', { messageId, fullText: text });
              controller.close();
            },
            onError: (error: Error) => {
              console.error('❌ Streaming error:', error);
              sendEvent('error', { error: error.message });
              controller.close();
            },
          };

          // Call appropriate streaming provider
          console.log('🌊 Starting stream with provider:', assistant.model_provider);
          if (assistant.model_provider === 'openai') {
            await streamOpenAI(assistant, userMessage, conversationHistory, callbacks);
          } else if (assistant.model_provider === 'anthropic') {
            await streamAnthropic(assistant, userMessage, conversationHistory, callbacks);
          } else if (assistant.model_provider === 'google') {
            await streamGoogle(assistant, userMessage, conversationHistory, callbacks);
          } else {
            throw new Error('Unsupported AI provider');
          }
        } catch (error: any) {
          console.error('L Streaming error:', error);
          sendEvent('error', { error: error.message });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('L Error setting up stream:', error);
    return new Response(error.message, { status: 500 });
  }
}
