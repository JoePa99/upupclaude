# Edge Function Deployment Guide

## Prerequisites

You need the Supabase CLI installed on your **local machine** (not in the cloud environment).

```bash
# macOS/Linux
brew install supabase/tap/supabase

# Windows
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm
npm install -g supabase
```

## Deployment Steps

### 1. Get your Supabase Project Reference

Go to your Supabase dashboard → Settings → General → Reference ID

### 2. Link your local project (one-time setup)

```bash
cd /path/to/upupclaude
supabase link --project-ref YOUR_PROJECT_REF
```

When prompted, enter your database password.

### 3. Set the API keys as secrets

```bash
supabase secrets set OPENAI_API_KEY=your-openai-api-key
supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
supabase secrets set GOOGLE_AI_API_KEY=your-google-ai-api-key
```

**Note:** These are separate from your Vercel environment variables. Edge Functions run in Supabase, not Vercel.

### 4. Deploy the Edge Function

```bash
supabase functions deploy ai-respond
```

### 5. Verify deployment

After deployment, the CLI will show you the function URL. It should look like:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/ai-respond
```

You can test it in the Supabase dashboard:
- Go to Edge Functions
- Find `ai-respond`
- Click "Invoke Function" to test

## Troubleshooting

### "Function not found" error
- Make sure you're in the project root directory
- Verify the function exists at `supabase/functions/ai-respond/index.ts`

### API key errors in function logs
- Double-check you set the secrets correctly
- Secrets are case-sensitive

### Database permission errors
- The function uses `SUPABASE_SERVICE_ROLE_KEY` which is automatically provided
- No additional setup needed for database access

## What happens after deployment?

1. When a user @mentions an assistant, the Next.js API route calls the Edge Function
2. The Edge Function runs in Supabase's Deno environment
3. It calls the AI provider (OpenAI/Anthropic/Google)
4. It saves the response to the database
5. The response appears in chat via Realtime
