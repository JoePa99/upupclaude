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
  command?: string;
}

interface ContextChunk {
  content: string;
  metadata: any;
  source_type: string;
  similarity: number;
}

/**
 * Generate embedding for a text query using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI Embedding API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Search for relevant context chunks using vector similarity
 */
async function retrieveContext(
  supabaseClient: any,
  workspaceId: string,
  userQuery: string,
  topK: number = 5
): Promise<ContextChunk[]> {
  console.log('📚 [CONTEXT] Generating embedding for query...');
  const queryEmbedding = await generateEmbedding(userQuery);

  console.log('📚 [CONTEXT] Searching for relevant chunks...');
  const { data, error } = await supabaseClient.rpc('search_embeddings', {
    query_embedding: queryEmbedding,
    workspace_uuid: workspaceId,
    match_threshold: 0.7, // Minimum similarity score
    match_count: topK,
    filter_source_type: 'company_os', // Only search CompanyOS for now
    filter_assistant_id: null,
  });

  if (error) {
    console.error('❌ [CONTEXT] Error searching embeddings:', error);
    return [];
  }

  console.log(`✓ [CONTEXT] Found ${data?.length || 0} relevant chunks`);
  return data || [];
}

/**
 * Fetch conversation history from the channel
 */
async function fetchConversationHistory(
  supabaseClient: any,
  channelId: string,
  assistantId: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string }>> {
  console.log('💬 [HISTORY] Fetching conversation history...');

  // Fetch recent messages from the channel
  const { data: messages, error } = await supabaseClient
    .from('messages')
    .select('author_type, author_id, content, created_at')
    .eq('channel_id', channelId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('❌ [HISTORY] Error fetching messages:', error);
    return [];
  }

  if (!messages || messages.length === 0) {
    console.log('ℹ️ [HISTORY] No previous messages found');
    return [];
  }

  // Convert to conversation format (reverse to chronological order)
  const history = messages
    .reverse()
    .map((msg: any) => ({
      role: msg.author_type === 'human' ? 'user' : 'assistant',
      content: msg.content,
    }));

  console.log(`✓ [HISTORY] Loaded ${history.length} messages`);
  return history;
}

/**
 * Build enhanced system prompt with context
 */
function buildContextualPrompt(
  baseSystemPrompt: string,
  assistantName: string,
  assistantRole: string,
  contextChunks: ContextChunk[]
): string {
  if (!contextChunks || contextChunks.length === 0) {
    return baseSystemPrompt;
  }

  const contextSection = contextChunks
    .map((chunk, idx) => {
      const sourceInfo = chunk.metadata?.source || 'Company Knowledge';
      const page = chunk.metadata?.page ? ` (p.${chunk.metadata.page})` : '';
      return `### Context ${idx + 1}: ${sourceInfo}${page}
${chunk.content}`;
    })
    .join('\n\n');

  return `# YOU ARE: ${assistantName}

${baseSystemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## COMPANY CONTEXT (CRITICAL - USE THIS INFORMATION)

You have access to the following relevant company knowledge. Reference this
information in your response when appropriate. Be specific and cite your sources
naturally (e.g., "According to our [source]...").

${contextSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Now respond to the user's question using the context above where relevant.`;
}

async function callOpenAI(assistant: any, conversationHistory: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Truncate conversation history to fit within token budget
  const truncatedHistory = truncateConversationHistory(
    conversationHistory,
    systemPrompt,
    TOKEN_LIMITS.openai,
    'openai'
  );

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: assistant.model_name,
      messages: [
        { role: 'system', content: systemPrompt },
        ...truncatedHistory,
      ],
      // Let OpenAI use optimal defaults for temperature and max_tokens
    }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error?.message || errorMessage;
    } catch {
      // If JSON parsing fails, use status text or response body
      const text = await response.text();
      errorMessage = text.substring(0, 200) || response.statusText || errorMessage;
    }
    throw new Error(`OpenAI API error: ${errorMessage}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Token limits per provider (conservative for cost control)
 *
 * These limits balance context quality with API costs:
 * - Higher limits = More context but higher costs
 * - Lower limits = Less context but lower costs
 *
 * Adjust these values based on your budget and context needs.
 */
const TOKEN_LIMITS = {
  anthropic: 100000,  // Claude models support 200k, using 100k for cost control
  openai: 120000,     // GPT-4 supports 128k, using 120k for cost control
  google: 100000,     // Gemini models support more, using 100k for cost control
};

/**
 * Estimate token count for text (rough approximation: ~4 chars per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate conversation history to fit within token limit
 */
function truncateConversationHistory(
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt: string,
  maxTokens: number,
  provider: string
): Array<{ role: string; content: string }> {
  const maxOutputTokens = 8192;
  const safetyBuffer = 1000; // Extra buffer for API overhead
  const availableTokens = maxTokens - maxOutputTokens - safetyBuffer;

  // Count system prompt tokens
  const systemTokens = estimateTokens(systemPrompt);
  let remainingTokens = availableTokens - systemTokens;

  console.log(`🔍 [TOKEN-LIMIT:${provider.toUpperCase()}] Max: ${maxTokens}, System prompt: ${systemTokens} tokens, Available for history: ${remainingTokens} tokens`);

  // If system prompt alone is too large, we have a problem
  if (remainingTokens <= 0) {
    console.warn(`⚠️ [TOKEN-LIMIT:${provider.toUpperCase()}] System prompt exceeds token limit, truncating severely`);
    return conversationHistory.slice(-2); // Keep only last 2 messages
  }

  // Truncate history from the beginning (keep most recent messages)
  const truncated: Array<{ role: string; content: string }> = [];
  let currentTokens = 0;

  // Process messages in reverse (most recent first)
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const message = conversationHistory[i];
    const messageTokens = estimateTokens(message.content);

    if (currentTokens + messageTokens <= remainingTokens) {
      truncated.unshift(message); // Add to beginning to maintain order
      currentTokens += messageTokens;
    } else {
      console.log(`✂️ [TOKEN-LIMIT:${provider.toUpperCase()}] Truncated ${conversationHistory.length - truncated.length} older messages to fit budget`);
      break;
    }
  }

  const totalEstimated = systemTokens + currentTokens + maxOutputTokens;
  console.log(`✓ [TOKEN-LIMIT:${provider.toUpperCase()}] Kept ${truncated.length}/${conversationHistory.length} messages (~${totalEstimated} total tokens)`);
  return truncated;
}

async function callAnthropic(assistant: any, conversationHistory: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Truncate conversation history to fit within token budget
  const truncatedHistory = truncateConversationHistory(
    conversationHistory,
    systemPrompt,
    TOKEN_LIMITS.anthropic,
    'anthropic'
  );

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: assistant.model_name,
      system: systemPrompt,
      messages: truncatedHistory,
      max_tokens: 8192, // Anthropic requires max_tokens, using generous default
    }),
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error?.message || errorMessage;
    } catch {
      // If JSON parsing fails, use status text or response body
      const text = await response.text();
      errorMessage = text.substring(0, 200) || response.statusText || errorMessage;
    }
    throw new Error(`Anthropic API error: ${errorMessage}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function callGoogle(assistant: any, conversationHistory: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  // Truncate conversation history to fit within token budget
  const truncatedHistory = truncateConversationHistory(
    conversationHistory,
    systemPrompt,
    TOKEN_LIMITS.google,
    'google'
  );

  // Google uses a different format - convert conversation history
  const contents = truncatedHistory.map((msg, idx) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: idx === 0 ? systemPrompt + '\n\n' + msg.content : msg.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${assistant.model_name}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        // Let Google use optimal defaults for temperature and maxOutputTokens
      }),
    }
  );

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const error = await response.json();
      errorMessage = error.error?.message || errorMessage;
    } catch {
      // If JSON parsing fails, use status text or response body
      const text = await response.text();
      errorMessage = text.substring(0, 200) || response.statusText || errorMessage;
    }
    throw new Error(`Google AI API error: ${errorMessage}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function generateImage(prompt: string, supabaseClient: any): Promise<string> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  console.log('🎨 [IMAGE] Generating image with prompt:', prompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate an image: ${prompt}`,
          }],
        }],
        generationConfig: {
          temperature: 1.0,
          responseModalities: ['image'],
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google AI Image API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();

  // Extract image data from response
  if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
    const imageData = data.candidates[0].content.parts[0].inlineData;
    const base64Image = imageData.data;
    const mimeType = imageData.mimeType || 'image/png';

    console.log('✓ [IMAGE] Image generated, uploading to storage...');

    // Convert base64 to binary
    const binaryString = atob(base64Image);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const filename = `${timestamp}-${randomId}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('generated-images')
      .upload(filename, bytes, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [IMAGE] Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('generated-images')
      .getPublicUrl(filename);

    console.log('✓ [IMAGE] Image uploaded successfully:', urlData.publicUrl);
    return `![Generated Image](${urlData.publicUrl})`;
  }

  throw new Error('No image data in response');
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
    const { assistantId, channelId, userMessage, command } = requestBody;

    if (!assistantId || !channelId || !userMessage) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Assistant ID, channel ID, and user message are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🤖 [AI-RESPOND] Processing AI response for assistant:', assistantId, command ? `with command: ${command}` : '');

    // Fetch assistant details
    const { data: assistant, error: assistantError } = await supabaseClient
      .from('assistants')
      .select('id, workspace_id, name, role, system_prompt, model_provider, model_name, avatar_url, status')
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

    let aiResponse: string;

    // Handle image generation command
    if (command === 'image') {
      console.log('🎨 [AI-RESPOND] Image generation command detected');
      aiResponse = await generateImage(userMessage, supabaseClient);
    } else {
      // Standard text response flow
      // Fetch conversation history and context in parallel (they don't depend on each other)
      const perfStart = Date.now();
      const [conversationHistory, contextChunks] = await Promise.all([
        fetchConversationHistory(
          supabaseClient,
          channelId,
          assistantId,
          15 // Last 15 messages (reduced from 20 for cost control)
        ),
        retrieveContext(
          supabaseClient,
          assistant.workspace_id,
          userMessage,
          3 // Top 3 most relevant chunks (reduced from 5 for cost control)
        ),
      ]);
      console.log(`⏱️ [PERF] History + Context (parallel): ${Date.now() - perfStart}ms`);

      // Build contextual system prompt
      const systemPrompt = buildContextualPrompt(
        assistant.system_prompt,
        assistant.name,
        assistant.role,
        contextChunks
      );

      // Call the appropriate AI provider with conversation history and context
      console.log('🔄 [AI-RESPOND] Calling', assistant.model_provider, 'API with context and history...');
      perfStart = Date.now();

      if (assistant.model_provider === 'openai') {
        aiResponse = await callOpenAI(assistant, conversationHistory, systemPrompt);
      } else if (assistant.model_provider === 'anthropic') {
        aiResponse = await callAnthropic(assistant, conversationHistory, systemPrompt);
      } else if (assistant.model_provider === 'google') {
        aiResponse = await callGoogle(assistant, conversationHistory, systemPrompt);
      } else {
        throw new Error(`Unsupported AI provider: ${assistant.model_provider}`);
      }

      console.log(`⏱️ [PERF] ${assistant.model_provider.toUpperCase()} API call: ${Date.now() - perfStart}ms`);
      console.log('✓ [AI-RESPOND] AI response generated:', aiResponse.substring(0, 100) + '...');
    }

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
