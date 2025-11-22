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
              sendEvent('token', { token, messageId });
            },
            onComplete: async (text: string) => {
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
              console.error('Streaming error:', error);
              sendEvent('error', { error: error.message });
              controller.close();
            },
          };

          // Call appropriate streaming provider
          if (assistant.model_provider === 'openai') {
            await streamOpenAI(assistant, userMessage, callbacks);
          } else if (assistant.model_provider === 'anthropic') {
            await streamAnthropic(assistant, userMessage, callbacks);
          } else if (assistant.model_provider === 'google') {
            await streamGoogle(assistant, userMessage, callbacks);
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
