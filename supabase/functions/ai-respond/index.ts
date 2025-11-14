import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRespondRequest {
  assistantId: string;
  channelId: string;
  userMessage: string;
}

async function callOpenAI(assistant: any, userMessage: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
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
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
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
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Create Supabase client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody: AIRespondRequest = await req.json();
    const { assistantId, channelId, userMessage } = requestBody;

    if (!assistantId || !channelId || !userMessage) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Assistant ID, channel ID, and user message are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🤖 [AI-RESPOND] Processing AI response for assistant:', assistantId);

    // Fetch assistant details
    const { data: assistant, error: assistantError } = await supabaseClient
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      console.error('❌ [AI-RESPOND] Assistant not found:', assistantError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Assistant not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✓ [AI-RESPOND] Assistant found:', assistant.name, 'Provider:', assistant.model_provider);

    // Call the appropriate AI provider
    console.log('🔄 [AI-RESPOND] Calling', assistant.model_provider, 'API...');
    let aiResponse: string;

    if (assistant.model_provider === 'openai') {
      aiResponse = await callOpenAI(assistant, userMessage);
    } else if (assistant.model_provider === 'anthropic') {
      aiResponse = await callAnthropic(assistant, userMessage);
    } else if (assistant.model_provider === 'google') {
      aiResponse = await callGoogle(assistant, userMessage);
    } else {
      throw new Error(`Unsupported AI provider: ${assistant.model_provider}`);
    }

    console.log('✓ [AI-RESPOND] AI response generated:', aiResponse.substring(0, 100) + '...');

    // Insert AI response as a message
    const { data: responseMessage, error: messageError } = await supabaseClient
      .from('messages')
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
      console.error('❌ [AI-RESPOND] Failed to insert AI response:', messageError);
      throw messageError;
    }

    const executionTime = Date.now() - startTime;
    console.log(`✅ [AI-RESPOND] AI response saved: ${responseMessage.id} (${executionTime}ms)`);

    return new Response(JSON.stringify({
      success: true,
      message: responseMessage,
      executionTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ [AI-RESPOND] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
