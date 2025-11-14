import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

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

async function callOpenAI(assistant: any, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: assistant.model_name,
      messages: [
        { role: 'system', content: assistant.system_prompt },
        { role: 'user', content: userMessage },
      ],
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callAnthropic(assistant: any, userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: assistant.model_name,
      system: assistant.system_prompt,
      messages: [
        { role: 'user', content: userMessage },
      ],
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(assistant: any, userMessage: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${assistant.model_name}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: assistant.system_prompt + '\n\n' + userMessage },
            ],
          },
        ],
        generationConfig: {
          temperature: assistant.temperature,
          maxOutputTokens: assistant.max_tokens,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google AI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
