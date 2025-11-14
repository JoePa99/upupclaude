import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, role, systemPrompt, modelProvider, modelName, temperature, maxTokens } = await request.json();

    if (!name || !role || !systemPrompt || !modelProvider || !modelName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: userProfile } = await (supabase
      .from('users') as any)
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Create assistant
    const { data: assistant, error: assistantError } = await (supabase
      .from('assistants') as any)
      .insert({
        workspace_id: userProfile.workspace_id,
        name: name.trim(),
        role: role.trim(),
        system_prompt: systemPrompt.trim(),
        model_provider: modelProvider,
        model_name: modelName,
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 2000,
        status: 'online',
        created_by: user.id,
      })
      .select()
      .single();

    if (assistantError) throw assistantError;

    return NextResponse.json({
      success: true,
      assistant,
    });
  } catch (error: any) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create assistant' },
      { status: 500 }
    );
  }
}
