import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
  const { id: workspaceId } = await params;

  try {
    // Delete the workspace (this will cascade delete related data based on DB constraints)
    // This includes: users, assistants, channels, messages, documents, embeddings
    const { error: deleteError } = await adminClient
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (deleteError) {
      console.error('❌ [ADMIN] Error deleting workspace:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete workspace' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error deleting workspace:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}
