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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const token = parsed.choices[0]?.delta?.content || '';
            if (token) {
              fullText += token;
              callbacks.onToken(token);
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error: any) {
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'content_block_delta') {
              const token = parsed.delta?.text || '';
              if (token) {
                fullText += token;
                callbacks.onToken(token);
              }
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error: any) {
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google AI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }

    callbacks.onComplete(fullText);
  } catch (error: any) {
    callbacks.onError(error);
  }
}
