import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
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

  // Use admin client to see ALL assistants across the platform
  const adminClient = createAdminClient();

  try {
    const { data: assistantsData, error } = await adminClient
      .from('assistants')
      .select('*, workspaces(name)')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data to include workspace name
    const assistants = (assistantsData as any[])?.map((assistant: any) => ({
      id: assistant.id,
      name: assistant.name,
      role: assistant.role,
      workspace_id: assistant.workspace_id,
      workspace_name: assistant.workspaces?.name,
      model: assistant.model,
      temperature: assistant.temperature,
      max_tokens: assistant.max_tokens,
      created_at: assistant.created_at,
    }));

    return NextResponse.json({ assistants: assistants || [] });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching assistants:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assistants' },
      { status: 500 }
    );
  }
}
