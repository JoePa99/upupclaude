/**
 * Streaming AI Provider functions
 * Returns ReadableStream for token-by-token responses
 */

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export async function streamOpenAI(
  assistant: any,
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Use sensible defaults if not set
  const temperature = assistant.temperature ?? 0.7;
  const maxTokens = assistant.max_tokens ?? 2000;

  console.log('🔵 OpenAI streaming request:', {
    model: assistant.model_name,
    messageLength: userMessage.length,
    temperature,
    maxTokens,
  });

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
      temperature,
      max_tokens: maxTokens,
      stream: true, // Enable streaming
    }),
  });

  console.log('🔵 OpenAI response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🔵 OpenAI API error response:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    } catch {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let chunkCount = 0;
  let tokenCount = 0;

  console.log('🔵 Starting OpenAI stream read loop...');

  try {
    while (true) {
      const { done, value } = await reader.read();
      chunkCount++;

      if (done) {
        console.log('🔵 OpenAI stream done. Chunks:', chunkCount, 'Tokens:', tokenCount, 'Total length:', fullText.length);
        break;
      }

      const chunk = decoder.decode(value);
      console.log('🔵 OpenAI chunk', chunkCount, 'size:', chunk.length, 'preview:', chunk.substring(0, 100));
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('🔵 OpenAI received [DONE] signal');
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices[0]?.delta?.content || '';
            if (token) {
              tokenCount++;
              fullText += token;
              callbacks.onToken(token);
            }
          } catch (e) {
            console.warn('🔵 Failed to parse OpenAI chunk:', data.substring(0, 100), e);
          }
        }
      }
    }

    console.log('🔵 OpenAI stream complete, calling onComplete with', fullText.length, 'characters');

    // If no content was received, treat it as an error
    if (fullText.length === 0 && tokenCount === 0) {
      console.error('🔵 OpenAI stream completed but received no tokens - this indicates an API error');
      callbacks.onError(new Error('OpenAI API returned empty response. Check API key, model name, and request parameters in server logs.'));
    } else {
      callbacks.onComplete(fullText);
    }
  } catch (error: any) {
    console.error('🔵 OpenAI stream error:', error);
    callbacks.onError(error);
  }
}

export async function streamAnthropic(
  assistant: any,
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured');
  }

  // Use sensible defaults if not set
  const temperature = assistant.temperature ?? 0.7;
  const maxTokens = assistant.max_tokens ?? 2000;

  console.log('🟣 Anthropic streaming request:', {
    model: assistant.model_name,
    messageLength: userMessage.length,
    temperature,
    maxTokens,
  });

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
      temperature,
      max_tokens: maxTokens,
      stream: true, // Enable streaming
    }),
  });

  console.log('🟣 Anthropic response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🟣 Anthropic API error response:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    } catch {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let chunkCount = 0;
  let tokenCount = 0;

  console.log('🟣 Starting Anthropic stream read loop...');

  try {
    while (true) {
      const { done, value } = await reader.read();
      chunkCount++;

      if (done) {
        console.log('🟣 Anthropic stream done. Chunks:', chunkCount, 'Tokens:', tokenCount, 'Total length:', fullText.length);
        break;
      }

      const chunk = decoder.decode(value);
      console.log('🟣 Anthropic chunk', chunkCount, 'size:', chunk.length, 'preview:', chunk.substring(0, 100));
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta') {
              const token = parsed.delta?.text || '';
              if (token) {
                tokenCount++;
                fullText += token;
                callbacks.onToken(token);
              }
            } else {
              console.log('🟣 Anthropic event type:', parsed.type);
            }
          } catch (e) {
            console.warn('🟣 Failed to parse Anthropic chunk:', data.substring(0, 100), e);
          }
        }
      }
    }

    console.log('🟣 Anthropic stream complete, calling onComplete with', fullText.length, 'characters');

    // If no content was received, treat it as an error
    if (fullText.length === 0 && tokenCount === 0) {
      console.error('🟣 Anthropic stream completed but received no tokens - this indicates an API error');
      callbacks.onError(new Error('Anthropic API returned empty response. Check API key, model name, and request parameters in server logs.'));
    } else {
      callbacks.onComplete(fullText);
    }
  } catch (error: any) {
    console.error('🟣 Anthropic stream error:', error);
    callbacks.onError(error);
  }
}

export async function streamGoogle(
  assistant: any,
  userMessage: string,
  callbacks: StreamCallbacks
): Promise<void> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error('Google AI API key not configured');
  }

  // Use sensible defaults if not set
  const temperature = assistant.temperature ?? 0.7;
  const maxTokens = assistant.max_tokens ?? 2000;

  console.log('🟢 Google AI streaming request:', {
    model: assistant.model_name,
    messageLength: userMessage.length,
    temperature,
    maxTokens,
  });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${assistant.model_name}:streamGenerateContent?key=${apiKey}`,
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
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    }
  );

  console.log('🟢 Google AI response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('🟢 Google AI API error response:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(`Google AI API error: ${error.error?.message || 'Unknown error'}`);
    } catch {
      throw new Error(`Google AI API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let chunkCount = 0;
  let tokenCount = 0;
  let buffer = ''; // Accumulate chunks since Google sends JSON array

  console.log('🟢 Starting Google AI stream read loop...');

  try {
    while (true) {
      const { done, value } = await reader.read();
      chunkCount++;

      if (done) {
        console.log('🟢 Google AI stream done. Chunks:', chunkCount, 'Tokens:', tokenCount, 'Total length:', fullText.length);
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log('🟢 Google AI chunk', chunkCount, 'size:', chunk.length, 'preview:', chunk.substring(0, 100));
      buffer += chunk;

      // Try to parse accumulated buffer as JSON array
      // Google streaming returns [{...}, {...}] format
      try {
        // Remove trailing commas and close the array if it's incomplete
        let parseBuffer = buffer.trim();

        // If buffer starts with [ but doesn't end with ], add ] to try parsing
        if (parseBuffer.startsWith('[') && !parseBuffer.endsWith(']')) {
          parseBuffer = parseBuffer.replace(/,\s*$/, '') + ']';
        }

        const parsed = JSON.parse(parseBuffer);
        const responses = Array.isArray(parsed) ? parsed : [parsed];

        // Process all responses in the array
        for (const response of responses) {
          const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text && !fullText.includes(text)) {
            // Google sends cumulative text, not deltas
            // Only add the new part
            const newText = text.substring(fullText.length);
            if (newText) {
              tokenCount++;
              fullText = text;
              callbacks.onToken(newText);
              console.log('🟢 Extracted token:', newText.substring(0, 50));
            }
          }
        }
      } catch (e) {
        // Buffer not complete yet, keep accumulating
        console.log('🟢 Buffer not complete, continuing... (this is normal)');
      }
    }

    console.log('🟢 Google AI stream complete, calling onComplete with', fullText.length, 'characters');

    // If no content was received, treat it as an error
    if (fullText.length === 0 && tokenCount === 0) {
      console.error('🟢 Google AI stream completed but received no tokens - this indicates an API error');
      callbacks.onError(new Error('Google AI API returned empty response. Check API key, model name, and request parameters in server logs.'));
    } else {
      callbacks.onComplete(fullText);
    }
  } catch (error: any) {
    console.error('🟢 Google AI stream error:', error);
    callbacks.onError(error);
  }
}
