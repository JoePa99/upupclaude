import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface ExtractTextRequest {
  documentId: string;
  workspaceId: string;
  storagePath: string;
  fileName: string;
  fileType: string;
  documentType?: 'company_os' | 'agent_doc' | 'playbook'; // Type of document
  assistantId?: string; // Required for agent_doc
  playbookId?: string; // Required for playbook
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('📄 [EXTRACT-TEXT] Starting text extraction');

    const {
      documentId,
      workspaceId,
      storagePath,
      fileName,
      fileType,
      documentType = 'company_os',
      assistantId,
      playbookId,
    }: ExtractTextRequest = await req.json();

    console.log('  Document ID:', documentId);
    console.log('  Document Type:', documentType);
    console.log('  File:', fileName);
    console.log('  Type:', fileType);

    // Initialize Supabase client (admin)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Download file from storage
    console.log('  📥 Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storagePath);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    console.log('  ✓ File downloaded, size:', fileData.size, 'bytes');

    // Extract text based on file type
    let extractedText = '';

    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      // Plain text - just read it
      extractedText = await fileData.text();
      console.log('  ✓ Extracted plain text:', extractedText.length, 'chars');
    } else if (fileType === 'text/markdown' || fileName.endsWith('.md')) {
      // Markdown - read as plain text
      extractedText = await fileData.text();
      console.log('  ✓ Extracted markdown:', extractedText.length, 'chars');
    } else if (
      fileType === 'application/pdf' ||
      fileName.endsWith('.pdf')
    ) {
      // PDF - use pdf-parse or similar
      // For now, mark as needing PDF extraction library
      console.log('  ⚠️  PDF extraction requires pdf-parse library');
      extractedText = '[PDF extraction not yet implemented - install pdf-parse]';
    } else if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      // DOCX - use mammoth or similar
      console.log('  ⚠️  DOCX extraction requires mammoth library');
      extractedText =
        '[DOCX extraction not yet implemented - install mammoth]';
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from document');
    }

    // Determine the correct table based on document type
    const tableName =
      documentType === 'company_os'
        ? 'company_os_documents'
        : documentType === 'agent_doc'
          ? 'agent_documents'
          : 'playbook_documents';

    // Update document with extracted text
    console.log('  💾 Saving extracted text to', tableName, '...');
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        extracted_text: extractedText,
        metadata: {
          extracted_at: new Date().toISOString(),
          char_count: extractedText.length,
          word_count: extractedText.split(/\s+/).length,
        },
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('  ✓ Text saved to database');

    // Trigger embedding generation
    console.log('  🔄 Triggering embedding generation...');
    const embedResult = await supabase.functions.invoke('generate-embeddings', {
      body: {
        documentId,
        workspaceId,
        extractedText,
        fileName,
        documentType,
        assistantId,
        playbookId,
      },
    });

    if (embedResult.error) {
      console.error('  ❌ Embedding generation failed:', embedResult.error);
      // Don't throw - text extraction succeeded
      await supabase
        .from(tableName)
        .update({
          status: 'ready',
          metadata: {
            warning: 'Text extracted but embedding generation failed',
          },
        })
        .eq('id', documentId);
    } else {
      console.log('  ✓ Embedding generation started');
    }

    console.log('✅ [EXTRACT-TEXT] Completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        charCount: extractedText.length,
        wordCount: extractedText.split(/\s+/).length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ [EXTRACT-TEXT] Error:', error.message);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
