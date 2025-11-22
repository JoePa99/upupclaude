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

  console.log('🔵 OpenAI streaming request:', {
    model: assistant.model_name,
    messageLength: userMessage.length,
    temperature: assistant.temperature,
    max_tokens: assistant.max_tokens,
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
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
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
    callbacks.onComplete(fullText);
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

  console.log('🟣 Anthropic streaming request:', {
    model: assistant.model_name,
    messageLength: userMessage.length,
    temperature: assistant.temperature,
    max_tokens: assistant.max_tokens,
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
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
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
    callbacks.onComplete(fullText);
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

  console.log('🟢 Google AI streaming request:', {
    model: assistant.model_name,
    messageLength: userMessage.length,
    temperature: assistant.temperature,
    max_tokens: assistant.max_tokens,
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
          temperature: assistant.temperature,
          maxOutputTokens: assistant.max_tokens,
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

  console.log('🟢 Starting Google AI stream read loop...');

  try {
    while (true) {
      const { done, value } = await reader.read();
      chunkCount++;

      if (done) {
        console.log('🟢 Google AI stream done. Chunks:', chunkCount, 'Tokens:', tokenCount, 'Total length:', fullText.length);
        break;
      }

      const chunk = decoder.decode(value);
      console.log('🟢 Google AI chunk', chunkCount, 'size:', chunk.length, 'preview:', chunk.substring(0, 100));
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (token) {
            tokenCount++;
            fullText += token;
            callbacks.onToken(token);
          } else {
            console.log('🟢 Google AI response structure:', JSON.stringify(parsed).substring(0, 200));
          }
        } catch (e) {
          console.warn('🟢 Failed to parse Google AI chunk:', line.substring(0, 100), e);
        }
      }
    }

    console.log('🟢 Google AI stream complete, calling onComplete with', fullText.length, 'characters');
    callbacks.onComplete(fullText);
  } catch (error: any) {
    console.error('🟢 Google AI stream error:', error);
    callbacks.onError(error);
  }
}
