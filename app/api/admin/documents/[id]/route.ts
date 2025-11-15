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
  const { id: documentId } = await params;

  try {
    // Get document details first to know the storage path
    const { data: document, error: fetchError } = await adminClient
      .from('company_os_documents')
      .select('storage_path')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage bucket
    const { error: storageError } = await adminClient.storage
      .from('documents')
      .remove([document.storage_path]);

    if (storageError) {
      console.error('❌ [ADMIN] Error deleting from storage:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete embeddings associated with this document
    const { error: embeddingsError } = await adminClient
      .from('embeddings')
      .delete()
      .eq('metadata->>document_id', documentId);

    if (embeddingsError) {
      console.error('❌ [ADMIN] Error deleting embeddings:', embeddingsError);
      // Continue with database deletion even if embeddings fail
    }

    // Delete the document record from database
    const { error: deleteError } = await adminClient
      .from('company_os_documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('❌ [ADMIN] Error deleting document:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ [ADMIN] Error deleting document:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}
