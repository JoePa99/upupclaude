import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
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

  try {
    // Fetch all playbooks
    const { data: playbooks, error: playbooksError } = await (adminClient
      .from('playbooks') as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (playbooksError) {
      throw playbooksError;
    }

    // Fetch workspace names and document counts for each playbook
    const playbooksWithDetails = await Promise.all(
      (playbooks || []).map(async (playbook: any) => {
        const { data: workspace } = await (adminClient
          .from('workspaces') as any)
          .select('name')
          .eq('id', playbook.workspace_id)
          .single();

        const { count } = await (adminClient
          .from('playbook_documents') as any)
          .select('id', { count: 'exact', head: true })
          .eq('playbook_id', playbook.id);

        return {
          ...playbook,
          workspace_name: workspace?.name,
          document_count: count || 0,
        };
      })
    );

    return NextResponse.json({ playbooks: playbooksWithDetails });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching playbooks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch playbooks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

  try {
    const { workspaceId, name, description } = await request.json();

    if (!workspaceId || !name || !description) {
      return NextResponse.json(
        { error: 'Workspace ID, name, and description are required' },
        { status: 400 }
      );
    }

    const { data: playbook, error: createError } = await (adminClient
      .from('playbooks') as any)
      .insert({
        workspace_id: workspaceId,
        name,
        description,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return NextResponse.json({ playbook });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error creating playbook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create playbook' },
      { status: 500 }
    );
  }
}
