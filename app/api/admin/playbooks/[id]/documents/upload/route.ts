import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check auth with regular client
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

  // Use admin client for all storage and database operations (bypass RLS)
  const adminClient = createAdminClient();
  const { id: playbookId } = await params;

  try {
    // Verify playbook exists and get workspace_id
    const { data: playbook, error: playbookError } = await (adminClient
      .from('playbooks') as any)
      .select('workspace_id')
      .eq('id', playbookId)
      .single();

    if (playbookError || !playbook) {
      return NextResponse.json(
        { error: 'Playbook not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    console.log('📄 [PLAYBOOKS] Starting upload:', file.name, 'Size:', file.size);

    // Create unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `playbooks/${playbookId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage (using admin client)
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [PLAYBOOKS] Storage error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✓ [PLAYBOOKS] File uploaded to storage:', storagePath);

    // Create document record (using admin client to bypass RLS)
    const documentData = {
      playbook_id: playbookId,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      status: 'processing',
      uploaded_by: user.id,
    };

    const { data: documentResult, error: documentError } = await adminClient
      .from('playbook_documents')
      .insert(documentData as any)
      .select()
      .single();

    if (documentError) {
      console.error('❌ [PLAYBOOKS] Database error:', documentError);
      throw new Error(`Database error: ${documentError.message}`);
    }

    const document = documentResult as any;

    console.log('✓ [PLAYBOOKS] Document record created:', document.id);

    // Trigger text extraction Edge Function (using admin client)
    console.log('🔄 [PLAYBOOKS] Triggering text extraction...');
    const extractResult = await adminClient.functions.invoke('extract-text', {
      body: {
        documentId: document.id,
        playbookId: playbookId,
        workspaceId: playbook.workspace_id,
        storagePath: storagePath,
        fileName: file.name,
        fileType: file.type,
        documentType: 'playbook', // Flag to indicate this is a playbook document
      },
    });

    if (extractResult.error) {
      console.error('❌ [PLAYBOOKS] Text extraction failed:', extractResult.error);
      // Update document status to error
      await adminClient
        .from('playbook_documents')
        .update({
          status: 'error',
          metadata: { error: extractResult.error.message },
        } as any)
        .eq('id', document.id);

      return NextResponse.json({
        success: true,
        document,
        warning: 'Document uploaded but text extraction failed. Check logs.',
      });
    }

    console.log('✅ [PLAYBOOKS] Upload complete:', document.id);

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded and processing started',
    });
  } catch (error: any) {
    console.error('❌ [PLAYBOOKS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
