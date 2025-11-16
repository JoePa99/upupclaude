import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
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
  const { id: playbookId, documentId } = await params;

  try {
    // Fetch document to get storage path
    const { data: document, error: fetchError } = await adminClient
      .from('playbook_documents')
      .select('storage_path')
      .eq('id', documentId)
      .eq('playbook_id', playbookId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from storage
    const { error: storageError } = await adminClient.storage
      .from('documents')
      .remove([document.storage_path as string]);

    if (storageError) {
      console.error('❌ [PLAYBOOKS] Storage deletion error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete embeddings for this document
    const { error: embeddingsError } = await adminClient
      .from('embeddings')
      .delete()
      .eq('source_type', 'playbook')
      .eq('source_id', documentId);

    if (embeddingsError) {
      console.error('❌ [PLAYBOOKS] Embeddings deletion error:', embeddingsError);
    }

    // Delete document record
    const { error: deleteError } = await adminClient
      .from('playbook_documents')
      .delete()
      .eq('id', documentId)
      .eq('playbook_id', playbookId);

    if (deleteError) {
      throw deleteError;
    }

    console.log('✅ [PLAYBOOKS] Document deleted:', documentId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [PLAYBOOKS] Error deleting document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
