/**
 * AI Provider functions for calling OpenAI, Anthropic, and Google AI APIs
 */

export async function callOpenAI(assistant: any, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Determine if this is a reasoning model (o1, o3, gpt-5.1, etc.)
  // Reasoning models don't support temperature and use max_completion_tokens
  const modelName = assistant.model_name.toLowerCase();
  const isReasoningModel =
    modelName.includes('o1') ||
    modelName.includes('o3') ||
    modelName.startsWith('gpt-5.1') ||
    modelName.includes('thinking');

  const requestBody: any = {
    model: assistant.model_name,
    messages: [
      { role: 'system', content: assistant.system_prompt },
      { role: 'user', content: userMessage },
    ],
  };

  // Reasoning models don't support temperature parameter
  if (!isReasoningModel) {
    requestBody.temperature = assistant.temperature;
  }

  // Use the appropriate token parameter based on the model
  if (isReasoningModel) {
    requestBody.max_completion_tokens = assistant.max_tokens;
  } else {
    requestBody.max_tokens = assistant.max_tokens;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function callAnthropic(assistant: any, userMessage: string): Promise<string> {
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

export async function callGoogle(assistant: any, userMessage: string): Promise<string> {
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
