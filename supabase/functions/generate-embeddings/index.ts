import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface GenerateEmbeddingsRequest {
  documentId: string;
  workspaceId: string;
  extractedText: string;
  fileName: string;
  documentType?: 'company_os' | 'agent_doc' | 'playbook';
  assistantId?: string; // Required for agent_doc
  playbookId?: string; // Required for playbook
}

interface Chunk {
  content: string;
  index: number;
  startChar: number;
  endChar: number;
}

// Chunk text into smaller pieces for embedding
function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): Chunk[] {
  const chunks: Chunk[] = [];
  let startIndex = 0;
  let chunkIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunk = text.slice(startIndex, endIndex);

    chunks.push({
      content: chunk.trim(),
      index: chunkIndex,
      startChar: startIndex,
      endChar: endIndex,
    });

    chunkIndex++;
    startIndex += chunkSize - overlap;
  }

  return chunks;
}

// Generate embedding using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔢 [GENERATE-EMBEDDINGS] Starting embedding generation');

    const {
      documentId,
      workspaceId,
      extractedText,
      fileName,
      documentType = 'company_os',
      assistantId,
      playbookId,
    }: GenerateEmbeddingsRequest = await req.json();

    console.log('  Document ID:', documentId);
    console.log('  Document Type:', documentType);
    console.log('  File:', fileName);
    console.log('  Text length:', extractedText.length, 'chars');

    // Initialize Supabase client (admin)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chunk the text
    console.log('  ✂️  Chunking text...');
    const chunks = chunkText(extractedText, 1000, 200);
    console.log('  ✓ Created', chunks.length, 'chunks');

    // Generate embeddings for each chunk
    console.log('  🤖 Generating embeddings...');
    const embeddingRecords = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`    Processing chunk ${i + 1}/${chunks.length}...`);

      try {
        const embedding = await generateEmbedding(chunk.content);

        const embeddingRecord: any = {
          workspace_id: workspaceId,
          source_id: documentId,
          content: chunk.content,
          embedding: embedding,
          source_type: documentType,
          source_id: documentId,
          metadata: {
            source: fileName,
            document_id: documentId,
            chunk_index: chunk.index,
            start_char: chunk.startChar,
            end_char: chunk.endChar,
            total_chunks: chunks.length,
          },
        };

        // Add assistant_id for agent_doc type
        if (documentType === 'agent_doc' && assistantId) {
          embeddingRecord.assistant_id = assistantId;
        }

        embeddingRecords.push(embeddingRecord);

        console.log(`    ✓ Chunk ${i + 1} embedded (${embedding.length}d vector)`);
      } catch (error: any) {
        console.error(`    ❌ Failed to embed chunk ${i + 1}:`, error.message);
        throw error;
      }
    }

    // Insert all embeddings into database
    console.log('  💾 Saving', embeddingRecords.length, 'embeddings to database...');
    const { error: insertError } = await supabase
      .from('embeddings')
      .insert(embeddingRecords);

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    console.log('  ✓ Embeddings saved');

    // Update document status to ready
    const tableName =
      documentType === 'company_os'
        ? 'company_os_documents'
        : documentType === 'agent_doc'
          ? 'agent_documents'
          : 'playbook_documents';

    console.log('  ✓ Updating document status to ready in', tableName, '...');
    const { data: updateData, error: updateError } = await supabase
      .from(tableName)
      .update({
        status: 'ready',
        total_chunks: chunks.length,
        metadata: {
          processed_at: new Date().toISOString(),
          chunk_count: chunks.length,
          embedding_count: embeddingRecords.length,
        },
      })
      .eq('id', documentId)
      .select();

    if (updateError) {
      console.error('  ❌ Failed to update document status:', updateError);
      console.error('  Document ID was:', documentId);
      console.error('  Table was:', tableName);
      // Don't throw - embeddings were created successfully
    } else {
      console.log('  ✅ Document status updated successfully:', updateData);
    }

    console.log('✅ [GENERATE-EMBEDDINGS] Completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        chunkCount: chunks.length,
        embeddingCount: embeddingRecords.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ [GENERATE-EMBEDDINGS] Error:', error.message);

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
