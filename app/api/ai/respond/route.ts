import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { callOpenAI, callAnthropic, callGoogle } from '@/lib/ai-providers';

// Force this route to use Node.js runtime (required for AI API calls)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const adminSupabase = createAdminClient();

  try {
    const { messageId, assistantId, channelId, userMessage } = await request.json();

    console.log('🤖 AI response request:', { messageId, assistantId, channelId });

    // Fetch assistant details
    const { data: assistant, error: assistantError } = await (adminSupabase
      .from('assistants') as any)
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      console.error('❌ Assistant not found:', assistantError);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    console.log('✓ Assistant found:', assistant.name, 'Provider:', assistant.model_provider);

    // Call the appropriate AI provider
    console.log('🔄 Calling', assistant.model_provider, 'API...');
    let aiResponse: string;

    if (assistant.model_provider === 'openai') {
      aiResponse = await callOpenAI(assistant, userMessage);
    } else if (assistant.model_provider === 'anthropic') {
      aiResponse = await callAnthropic(assistant, userMessage);
    } else if (assistant.model_provider === 'google') {
      aiResponse = await callGoogle(assistant, userMessage);
    } else {
      throw new Error('Unsupported AI provider');
    }

    console.log('✓ AI response generated:', aiResponse.substring(0, 100) + '...');

    // Insert AI response as a message
    const { data: responseMessage, error: messageError } = await (adminSupabase
      .from('messages') as any)
      .insert({
        channel_id: channelId,
        author_id: assistantId,
        author_type: 'assistant',
        content: aiResponse,
        mentions: [],
        counts_toward_limit: false, // AI responses don't count toward limit
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Failed to insert AI response:', messageError);
      throw messageError;
    }

    console.log('✅ AI response saved to database:', responseMessage.id);

    return NextResponse.json({
      success: true,
      message: responseMessage,
    });
  } catch (error: any) {
    console.error('❌ Error generating AI response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI response', details: error },
      { status: 500 }
    );
  }
}
