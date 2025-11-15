import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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
  const workspaceId = params.id;

  try {
    // Get workspace details
    const { data: workspace, error: workspaceError } = await adminClient
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get all company data in parallel
    const [assistants, documents, users, embeddingsCount] = await Promise.all([
      adminClient
        .from('assistants')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      adminClient
        .from('company_os_documents')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      adminClient
        .from('users')
        .select('id, email, full_name, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false }),
      adminClient
        .from('embeddings')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId),
    ]);

    return NextResponse.json({
      workspace,
      assistants: assistants.data || [],
      documents: documents.data || [],
      users: users.data || [],
      embeddingsCount: embeddingsCount.count || 0,
    });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching company data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company data' },
      { status: 500 }
    );
  }
}
