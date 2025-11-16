import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @deno-types="npm:@types/pdf-parse@1.1.1"
import pdfParse from 'npm:pdf-parse@1.1.1';
// @deno-types="npm:@types/mammoth@1.0.5"
import mammoth from 'npm:mammoth@1.6.0';
import * as XLSX from 'npm:xlsx@0.18.5';
import JSZip from 'npm:jszip@3.10.1';

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

/**
 * Extract text from PPTX files by parsing the underlying XML
 */
async function extractTextFromPPTX(arrayBuffer: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideTexts: string[] = [];

  // Get all slide files (ppt/slides/slide*.xml)
  const slideFiles = Object.keys(zip.files).filter((name) =>
    name.match(/ppt\/slides\/slide\d+\.xml/)
  );

  // Sort slides by number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
    return numA - numB;
  });

  // Extract text from each slide
  for (const slideFile of slideFiles) {
    const slideXml = await zip.files[slideFile].async('text');
    // Extract text from <a:t> tags (text runs in PowerPoint XML)
    const textMatches = slideXml.matchAll(/<a:t>([^<]+)<\/a:t>/g);
    const slideText = Array.from(textMatches)
      .map((match) => match[1])
      .join(' ');

    if (slideText.trim()) {
      slideTexts.push(slideText.trim());
    }
  }

  return slideTexts.join('\n\n');
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
    } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      // CSV - convert to readable format
      const csvText = await fileData.text();
      const workbook = XLSX.read(csvText, { type: 'string' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      extractedText = XLSX.utils.sheet_to_txt(worksheet);
      console.log('  ✓ Extracted CSV:', extractedText.length, 'chars');
    } else if (
      fileType === 'application/pdf' ||
      fileName.endsWith('.pdf')
    ) {
      // PDF - use pdf-parse
      console.log('  📄 Processing PDF...');
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
      console.log('  ✓ Extracted PDF:', pdfData.numpages, 'pages,', extractedText.length, 'chars');
    } else if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      // DOCX - use mammoth
      console.log('  📄 Processing DOCX...');
      const arrayBuffer = await fileData.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value;
      console.log('  ✓ Extracted DOCX:', extractedText.length, 'chars');
    } else if (
      fileType === 'application/msword' ||
      fileName.endsWith('.doc')
    ) {
      // Legacy DOC format - not easily parseable, return error message
      console.log('  ⚠️  Legacy .doc format detected');
      throw new Error(
        'Legacy .doc format not supported. Please convert to .docx format.'
      );
    } else if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      fileName.endsWith('.pptx')
    ) {
      // PPTX - extract text from slides
      console.log('  📄 Processing PPTX...');
      const arrayBuffer = await fileData.arrayBuffer();
      extractedText = await extractTextFromPPTX(arrayBuffer);
      console.log('  ✓ Extracted PPTX:', extractedText.length, 'chars');
    } else if (
      fileType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileName.endsWith('.xlsx')
    ) {
      // XLSX - convert sheets to text
      console.log('  📊 Processing XLSX...');
      const arrayBuffer = await fileData.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      // Extract text from all sheets
      const sheetsText = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet, { FS: '\t', RS: '\n' });
        return `Sheet: ${sheetName}\n${sheetText}`;
      }).join('\n\n');

      extractedText = sheetsText;
      console.log('  ✓ Extracted XLSX:', workbook.SheetNames.length, 'sheets,', extractedText.length, 'chars');
    } else if (
      fileType === 'application/vnd.ms-excel' ||
      fileName.endsWith('.xls')
    ) {
      // Legacy XLS format
      console.log('  📊 Processing XLS...');
      const arrayBuffer = await fileData.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      const sheetsText = workbook.SheetNames.map((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const sheetText = XLSX.utils.sheet_to_txt(worksheet, { FS: '\t', RS: '\n' });
        return `Sheet: ${sheetName}\n${sheetText}`;
      }).join('\n\n');

      extractedText = sheetsText;
      console.log('  ✓ Extracted XLS:', workbook.SheetNames.length, 'sheets,', extractedText.length, 'chars');
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
