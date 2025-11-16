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
    // Fetch agent documents for this assistant
    const { data: documents, error: documentsError } = await adminClient
      .from('agent_documents')
      .select('*')
      .eq('assistant_id', assistantId)
      .order('created_at', { ascending: false });

    if (documentsError) {
      throw documentsError;
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching agent documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
