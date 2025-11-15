import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { checkSuperAdmin } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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
    return NextResponse.json({ error: 'Forbidden: Superadmin access required' }, { status: 403 });
  }

  // Use admin client for all storage and database operations (bypass RLS)
  const adminClient = createAdminClient();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const workspaceId = formData.get('workspaceId') as string;

    if (!file || !workspaceId) {
      return NextResponse.json(
        { error: 'File and workspace ID are required' },
        { status: 400 }
      );
    }

    console.log('📄 [UPLOAD] Starting upload:', file.name, 'Size:', file.size);

    // Create unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${workspaceId}/${timestamp}_${sanitizedFileName}`;

    // Upload to Supabase Storage (using admin client)
    const { data: uploadData, error: uploadError } = await adminClient.storage
      .from('documents')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [UPLOAD] Storage error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✓ [UPLOAD] File uploaded to storage:', storagePath);

    // Create document record (using admin client to bypass RLS)
    const documentData = {
      workspace_id: workspaceId,
      filename: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      status: 'processing',
    };

    const { data: documentResult, error: documentError } = await adminClient
      .from('company_os_documents')
      .insert(documentData as any)
      .select()
      .single();

    if (documentError) {
      console.error('❌ [UPLOAD] Database error:', documentError);
      throw new Error(`Database error: ${documentError.message}`);
    }

    const document = documentResult as any;

    console.log('✓ [UPLOAD] Document record created:', document.id);

    // Trigger text extraction Edge Function (using admin client)
    console.log('🔄 [UPLOAD] Triggering text extraction...');
    const extractResult = await adminClient.functions.invoke('extract-text', {
      body: {
        documentId: document.id,
        workspaceId: workspaceId,
        storagePath: storagePath,
        fileName: file.name,
        fileType: file.type,
      },
    });

    if (extractResult.error) {
      console.error('❌ [UPLOAD] Text extraction failed:', extractResult.error);
      // Update document status to error
      const errorUpdate: any = { status: 'error', metadata: { error: extractResult.error.message } };
      await adminClient
        .from('company_os_documents')
        .update(errorUpdate)
        .eq('id', document.id);

      return NextResponse.json({
        success: true,
        document,
        warning: 'Document uploaded but text extraction failed. Check logs.',
      });
    }

    console.log('✅ [UPLOAD] Upload complete:', document.id);

    return NextResponse.json({
      success: true,
      document,
      message: 'Document uploaded and processing started',
    });
  } catch (error: any) {
    console.error('❌ [UPLOAD] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
