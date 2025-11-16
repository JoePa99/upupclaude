import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check superadmin access
  try {
    checkSuperAdmin(user.email);
  } catch (error) {
    return NextResponse.json(
      { error: 'Forbidden: Superadmin access required' },
      { status: 403 }
    );
  }

  const adminClient = createAdminClient();
  const { id: assistantId } = await params;

  try {
    const body = await request.json();
    const { name, role, systemPrompt, modelProvider, modelName, temperature, maxTokens } = body;

    if (!name || !role || !systemPrompt || !modelProvider || !modelName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updateData = {
      name: name.trim(),
      role: role.trim(),
      system_prompt: systemPrompt.trim(),
      model_provider: modelProvider,
      model_name: modelName,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 4000,
    };

    const { data: assistant, error: updateError } = await (adminClient
      .from('assistants') as any)
      .update(updateData)
      .eq('id', assistantId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [ADMIN] Error updating assistant:', updateError);
      return NextResponse.json(
        { error: updateError.message || 'Failed to update assistant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, assistant });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error updating assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update assistant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check superadmin access
  try {
    checkSuperAdmin(user.email);
  } catch (error) {
    return NextResponse.json(
      { error: 'Forbidden: Superadmin access required' },
      { status: 403 }
    );
  }

  const adminClient = createAdminClient();
  const { id: assistantId } = await params;

  try {
    // Delete the assistant (this will cascade delete related data like embeddings if configured)
    const { error: deleteError } = await adminClient
      .from('assistants')
      .delete()
      .eq('id', assistantId);

    if (deleteError) {
      console.error('❌ [ADMIN] Error deleting assistant:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete assistant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error deleting assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete assistant' },
      { status: 500 }
    );
  }
}
