# AI Response Architecture - Critical Notes

## ⚠️ IMPORTANT: How AI Responses Work in upupdnd

### The Correct Approach (What We Use)

**All AI processing MUST happen in Supabase Edge Functions, NOT in Vercel/Next.js API routes.**

### Why Edge Functions?

1. **Serverless timeout limits**: Vercel/Next.js API routes have strict timeout limits and terminate immediately after returning a response, killing any pending async operations.

2. **Proper serverless environment**: Supabase Edge Functions are designed for long-running AI workloads and won't timeout prematurely.

3. **No auth middleware issues**: Edge Functions run in Supabase's environment with direct database access, avoiding the auth middleware problems we encountered.

### How to Create Edge Functions

**✅ DO THIS:**
- Create Edge Functions through the **Supabase Dashboard UI**
- Go to: Your Project → Edge Functions → Create a new function
- Copy/paste the code from `supabase/functions/ai-respond/index.ts`
- Deploy directly in the dashboard

**❌ DON'T DO THIS:**
- Don't try to deploy via CLI if network restrictions exist
- Don't try to run AI workloads in Next.js API routes
- Don't set AI API keys in Vercel environment variables (they won't be accessible to Edge Functions)

### API Keys Configuration

**API keys MUST be set as Supabase Edge Function Secrets:**

Location: Supabase Dashboard → Project Settings → Edge Functions → Manage Secrets

**Current providers:**
- `OPENAI_API_KEY` - For GPT models
- `ANTHROPIC_API_KEY` - For Claude models
- `GOOGLE_AI_API_KEY` - For Gemini models (including image generation)
- `PERPLEXITY_API_KEY` - For deep research with web search (optional)

**Future providers to add:**
- `COHERE_API_KEY` - For Cohere models

**Note:** These are completely separate from Vercel environment variables. Vercel variables are for the Next.js app, Supabase secrets are for Edge Functions.

### Architecture Flow

```
User sends message with @mention
     ↓
Next.js API route (/api/messages/send)
     ↓
Saves message to database
     ↓
Calls Supabase Edge Function (supabase.functions.invoke('ai-respond'))
     ↓
Edge Function runs (fetches assistant, calls AI provider, saves response)
     ↓
Response appears via Realtime subscription
```

### Key Code Locations

- **Edge Function**: `supabase/functions/ai-respond/index.ts`
- **Invocation**: `app/api/messages/send/route.ts` (lines 71-93)
- **Realtime listener**: `app/page-client.tsx` (receives AI responses)

### What We Learned (Mistakes to Avoid)

1. ❌ Tried to run AI calls directly in Next.js API routes
   - **Problem**: Serverless functions terminate immediately, killing async operations

2. ❌ Used `forEach` with async callbacks
   - **Problem**: forEach doesn't await promises, operations get killed

3. ❌ Made HTTP calls from one API route to another
   - **Problem**: Auth middleware blocks server-to-server calls

4. ❌ Put API keys in Vercel environment variables
   - **Problem**: Edge Functions can't access Vercel env vars

5. ✅ **CORRECT SOLUTION**: Use Supabase Edge Functions with secrets set in Supabase Dashboard

### Testing After Deployment

1. Deploy the Edge Function via Supabase Dashboard
2. Set all API key secrets in Supabase
3. Test by sending a message: `@sales let's go sell some footballs`
4. Check Supabase Edge Function logs for execution details
5. AI response should appear in chat via Realtime

### Deep Research Feature

**What is Deep Research?**
Deep research allows assistants to bypass their configured persona and conduct general research using web search capabilities.

**How it works:**
1. Enable "Deep Research" when creating/editing an assistant
2. Use the `/research` command to trigger deep research mode
3. Perplexity API is called with web search enabled
4. Response includes current information with citations
5. The assistant's regular system prompt is ignored during research

**Why this matters:**
- Assistants with specific personas (e.g., "CPB Program Architect") can be too restrictive
- Deep research allows them to answer general questions when needed
- Uses Perplexity's `sonar-reasoning` model for accurate, cited answers
- Provides real-time web information instead of training data only

**Setup:**
1. Set `PERPLEXITY_API_KEY` in Supabase Edge Function secrets
2. Get API key from: https://www.perplexity.ai/settings/api
3. Enable "Deep Research" toggle when creating an assistant
4. Use `/research` command in chat to trigger it

**Code location:** `supabase/functions/ai-respond/index.ts` (conductDeepResearch function)

### Future Enhancements

When adding new AI providers (Cohere, etc.):
1. Add the provider function to `supabase/functions/ai-respond/index.ts`
2. Add the API key secret in Supabase Dashboard
3. Update the model selection in `components/CreateAssistantModal.tsx`
4. No changes needed to Vercel/Next.js configuration
