import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    console.log('Create assistant request body:', body);

    const { name, role, systemPrompt, modelProvider, modelName, temperature, maxTokens } = body;

    if (!name || !role || !systemPrompt || !modelProvider || !modelName) {
      console.error('Missing required fields:', { name, role, systemPrompt, modelProvider, modelName });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user's workspace
    const { data: userProfile, error: profileError } = await (supabase
      .from('users') as any)
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    console.log('User profile:', userProfile, 'Error:', profileError);

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const assistantData = {
      workspace_id: userProfile.workspace_id,
      name: name.trim(),
      role: role.trim(),
      system_prompt: systemPrompt.trim(),
      model_provider: modelProvider,
      model_name: modelName,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 4000,
      status: 'online',
      created_by: user.id,
    };

    console.log('Creating assistant with data:', assistantData);

    // Create assistant using admin client to bypass RLS
    const { data: assistant, error: assistantError } = await (adminSupabase
      .from('assistants') as any)
      .insert(assistantData)
      .select()
      .single();

    if (assistantError) {
      console.error('Database error creating assistant:', assistantError);
      throw assistantError;
    }

    console.log('Assistant created successfully:', assistant);

    return NextResponse.json({
      success: true,
      assistant,
    });
  } catch (error: any) {
    console.error('Error creating assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create assistant', details: error },
      { status: 500 }
    );
  }
}
