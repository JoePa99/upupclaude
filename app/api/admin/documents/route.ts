import { createClient } from '@/lib/supabase/server';
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

  try {
    const { data: documents, error } = await supabase
      .from('company_os_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error fetching documents:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
