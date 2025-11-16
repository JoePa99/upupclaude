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
  const { id: playbookId } = await params;

  try {
    // Fetch all documents for this playbook to delete from storage
    const { data: documents } = await (adminClient
      .from('playbook_documents') as any)
      .select('id, storage_path')
      .eq('playbook_id', playbookId);

    // Delete storage files
    if (documents && documents.length > 0) {
      const storagePaths = documents
        .map((doc: any) => doc.storage_path)
        .filter(Boolean);

      if (storagePaths.length > 0) {
        const { error: storageError } = await adminClient.storage
          .from('documents')
          .remove(storagePaths);

        if (storageError) {
          console.error('❌ [PLAYBOOKS] Storage deletion error:', storageError);
        }
      }

      // Delete embeddings for all documents
      const documentIds = documents.map((doc: any) => doc.id);
      const { error: embeddingsError } = await adminClient
        .from('embeddings')
        .delete()
        .eq('source_type', 'playbook')
        .in('source_id', documentIds);

      if (embeddingsError) {
        console.error('❌ [PLAYBOOKS] Embeddings deletion error:', embeddingsError);
      }
    }

    // Delete the playbook (cascade will delete playbook_documents)
    const { error: deleteError } = await adminClient
      .from('playbooks')
      .delete()
      .eq('id', playbookId);

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ [PLAYBOOKS] Playbook deleted:', playbookId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [PLAYBOOKS] Error deleting playbook:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete playbook' },
      { status: 500 }
    );
  }
}
