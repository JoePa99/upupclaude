import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
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
    // Fetch the assistant
    const { data: assistant, error: assistantError } = await (adminClient
      .from('assistants') as any)
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }

    // Fetch workspace name
    const { data: workspace } = await (adminClient
      .from('workspaces') as any)
      .select('name')
      .eq('id', assistant.workspace_id)
      .single();

    return NextResponse.json({
      assistant: {
        ...assistant,
        workspace_name: workspace?.name,
      },
    });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching assistant:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assistant' },
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
