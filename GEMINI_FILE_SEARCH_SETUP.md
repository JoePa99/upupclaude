# Gemini File Search Setup Guide

## 🚀 Performance Improvement

**BEFORE (Anthropic with custom RAG):**
- History + Context retrieval: ~1,315ms
- Anthropic API call: **132,412ms** (132 seconds!)
- Total: ~134 seconds 😱

**AFTER (Gemini with File Search):**
- History only: ~300ms (no custom RAG needed)
- Gemini API call: **~2-5 seconds** (estimated)
- Total: **~3-6 seconds** ✨ (20-40x faster!)

## 🎯 Benefits

1. **Much Faster Responses**: Native Gemini grounding is significantly faster than Anthropic
2. **Simplified Architecture**: No need for custom OpenAI embeddings + vector search
3. **Better Grounding**: Google's File API provides more accurate context retrieval
4. **Lower Costs**: Fewer API calls (no OpenAI embeddings needed)
5. **Easier Maintenance**: Let Google handle the RAG infrastructure

## 📋 Setup Steps

### 1. Create a Google AI Corpus

First, create a corpus for your workspace using the Google Generative Language API:

```bash
curl -X POST \
  https://generativelanguage.googleapis.com/v1beta/corpora \
  -H "X-Goog-Api-Key: YOUR_GOOGLE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Workspace: [Your Workspace Name]"
  }'
```

**Response:**
```json
{
  "name": "corpora/corpus-abc123xyz",
  "displayName": "Workspace: [Your Workspace Name]",
  "createTime": "2025-01-15T10:30:00Z",
  "updateTime": "2025-01-15T10:30:00Z"
}
```

**Save the corpus ID** (e.g., `corpora/corpus-abc123xyz`)

### 2. Upload Documents to the Corpus

Upload your company knowledge documents:

```bash
# Upload a file to Google File API first
curl -X POST \
  https://generativelanguage.googleapis.com/upload/v1beta/files \
  -H "X-Goog-Api-Key: YOUR_GOOGLE_AI_API_KEY" \
  -F "file=@/path/to/company_handbook.pdf" \
  -F "metadata={\"displayName\":\"Company Handbook\"}"

# Get the file URI from response
# Example: files/file-xyz789

# Link the file to your corpus
curl -X POST \
  https://generativelanguage.googleapis.com/v1beta/corpora/corpus-abc123xyz/documents \
  -H "X-Goog-Api-Key: YOUR_GOOGLE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Company Handbook",
    "parts": [{
      "fileData": {
        "fileUri": "files/file-xyz789"
      }
    }]
  }'
```

### 3. Update Your Workspace with Corpus ID

Run this SQL in Supabase SQL Editor:

```sql
-- First, run the migration to add the column
-- (This is already in supabase/migrations/add_google_corpus_id.sql)

-- Then update your workspace with the corpus ID
UPDATE workspaces
SET google_corpus_id = 'corpora/corpus-abc123xyz'
WHERE id = 'YOUR_WORKSPACE_ID';
```

**To find your workspace ID:**
```sql
SELECT id, name FROM workspaces;
```

### 4. Create or Update Assistants to Use Gemini

When creating assistants:
- Set `model_provider` to `google`
- Use model names like:
  - `gemini-2.0-flash-exp` (recommended - fast and cheap)
  - `gemini-1.5-pro` (more powerful, slower)
  - `gemini-1.5-flash` (balanced)

The system will automatically detect the `google_corpus_id` and use Gemini File Search for grounding!

### 5. Deploy Updated Edge Function

```bash
# If using Supabase CLI
supabase functions deploy ai-respond

# OR deploy via Supabase Dashboard:
# 1. Go to Edge Functions
# 2. Select "ai-respond"
# 3. Copy/paste the updated code from supabase/functions/ai-respond/index.ts
# 4. Click "Deploy"
```

## 🔍 How It Works

### Before (Custom RAG)
```
User Query
  ↓
Generate OpenAI Embedding (~500ms)
  ↓
Search Vector DB (~800ms)
  ↓
Build Context Prompt
  ↓
Call Anthropic API (132 seconds!)
  ↓
Response
```

### After (Gemini File Search)
```
User Query
  ↓
Call Gemini with Corpus ID
  ↓
Gemini searches corpus natively
  ↓
Gemini generates grounded response (~3-5s)
  ↓
Response
```

## 📊 Monitoring

Check the logs for these new indicators:

**Using Gemini File Search:**
```
🚀 [GEMINI-FILE-SEARCH] Using native Gemini grounding (skipping custom RAG)
📚 [GEMINI-FILE-SEARCH] Using corpus: corpora/corpus-abc123xyz
⏱️ [PERF] History only: 287ms
⏱️ [PERF] GOOGLE API call: 3421ms
```

**Fallback to Custom RAG (Anthropic/OpenAI):**
```
📚 [CUSTOM-RAG] Using traditional RAG with embeddings
📚 [CONTEXT] Generating embedding for query...
📚 [CONTEXT] Searching for relevant chunks...
✓ [CONTEXT] Found 3 relevant chunks
⏱️ [PERF] History + Context (parallel): 1315ms
⏱️ [PERF] ANTHROPIC API call: 132412ms
```

## 🎛️ Configuration Options

### Environment Variables
Already set in Supabase Edge Function Secrets:
- `GOOGLE_AI_API_KEY` - Your Google AI API key

### Database Schema
```sql
-- workspaces table
google_corpus_id TEXT  -- Set to 'corpora/corpus-xyz' to enable Gemini File Search
```

### Assistant Configuration
- **Provider**: `google` (required)
- **Model**: `gemini-2.0-flash-exp` (recommended)
- **System Prompt**: Works the same, but context is provided by Gemini File Search

## 🚨 Troubleshooting

### Issue: Still using custom RAG with Gemini assistant
**Solution**: Make sure `google_corpus_id` is set in the workspace:
```sql
SELECT google_corpus_id FROM workspaces WHERE id = 'YOUR_WORKSPACE_ID';
```

### Issue: "Corpus not found" error
**Solution**: Verify the corpus ID is correct and accessible:
```bash
curl https://generativelanguage.googleapis.com/v1beta/corpora/YOUR_CORPUS_ID \
  -H "X-Goog-Api-Key: YOUR_API_KEY"
```

### Issue: No relevant context in responses
**Solution**: Make sure documents are uploaded and linked to the corpus:
```bash
curl https://generativelanguage.googleapis.com/v1beta/corpora/YOUR_CORPUS_ID/documents \
  -H "X-Goog-Api-Key: YOUR_API_KEY"
```

## 📝 Migration Checklist

- [ ] Run database migration to add `google_corpus_id` column
- [ ] Create Google AI Corpus for each workspace
- [ ] Upload company documents to corpus
- [ ] Update workspace with corpus ID
- [ ] Switch assistants from Anthropic to Google provider
- [ ] Deploy updated `ai-respond` edge function
- [ ] Test a chat message and verify speed improvement
- [ ] Monitor logs to confirm Gemini File Search is active

## 🎯 Next Steps

1. **Automate Corpus Management**: Build UI to manage corpus and documents
2. **Document Sync**: Auto-sync new CompanyOS documents to corpus
3. **Multi-Corpus Support**: Support different corpora for different assistants
4. **Analytics**: Track performance improvements and cost savings

## 📚 References

- [Google Generative Language API - Corpora](https://ai.google.dev/api/semantic-retrieval)
- [Gemini File API Documentation](https://ai.google.dev/gemini-api/docs/file-api)
- [Google Search Retrieval Tool](https://ai.google.dev/gemini-api/docs/grounding)
