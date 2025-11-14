# Supabase Setup Guide

UpUp uses Supabase for:
- **Authentication** - User login/signup with email
- **Database** - Postgres with multi-tenant data isolation
- **Vector Storage** - pgvector for semantic search (replaces Pinecone)
- **Real-time** - Live messaging updates
- **File Storage** - Document uploads (CompanyOS, playbooks, agent docs)

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Choose organization and project name (e.g., "upup-prod")
4. Select a region close to your users
5. Set a secure database password (save this!)
6. Wait ~2 minutes for provisioning

### 2. Get Your API Keys

From your Supabase dashboard:
1. Go to **Settings → API**
2. Copy these values:

```bash
Project URL: https://xxxxx.supabase.co
anon/public key: eyJhbGc...
service_role key: eyJhbGc... (keep this secret!)
```

### 3. Set Environment Variables

Create `.env.local` in your project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI Providers (add these later)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
COHERE_API_KEY=...
```

### 4. Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click "Run"

This creates:
- ✅ All tables (workspaces, users, assistants, channels, messages, etc.)
- ✅ Vector embeddings table with pgvector
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Helper functions for search

### 5. Enable Vector Extension

The schema already includes this, but verify:

```sql
create extension if not exists vector;
```

### 6. Configure Storage Buckets

Go to **Storage** in Supabase dashboard and create these buckets:

1. **company-os-docs** (private)
   - For CompanyOS document uploads
   - Max file size: 50MB

2. **agent-docs** (private)
   - For agent-specific documents
   - Max file size: 50MB

3. **playbook-docs** (private)
   - For playbook documents
   - Max file size: 50MB

4. **avatars** (public)
   - For user/assistant avatars
   - Max file size: 2MB

Storage policies (add in Storage → Policies):

```sql
-- Allow authenticated users to upload to their workspace buckets
create policy "Users can upload workspace files"
on storage.objects for insert
with check (
  bucket_id in ('company-os-docs', 'agent-docs', 'playbook-docs')
  and auth.uid() in (select id from users)
);

-- Allow authenticated users to read workspace files
create policy "Users can read workspace files"
on storage.objects for select
using (
  bucket_id in ('company-os-docs', 'agent-docs', 'playbook-docs')
  and auth.uid() in (select id from users)
);
```

### 7. Set Up Authentication

Go to **Authentication → Providers** in Supabase:

**Email (enabled by default):**
- ✅ Enable email confirmation (recommended)
- ✅ Set custom SMTP (optional, for branded emails)

**OAuth Providers (optional):**
- Add Google, GitHub, etc. if you want social login
- Follow Supabase docs for each provider

### 8. Configure Realtime

Go to **Database → Replication**:

Enable realtime for these tables:
- ✅ messages
- ✅ channels
- ✅ channel_members

This allows live message updates without polling.

## 📊 Database Schema Overview

```
workspaces
├── users (team members)
├── assistants (AI agents)
├── channels
│   ├── channel_members (users in channels)
│   ├── channel_assistants (AI in channels)
│   └── messages
├── company_os_documents
│   └── embeddings (vectors)
├── playbooks
│   └── playbook_documents
│       └── embeddings (vectors)
└── assistants
    └── agent_documents
        └── embeddings (vectors)
```

### Key Features

**Multi-Tenant Isolation:**
- All queries filtered by `workspace_id`
- Row Level Security enforces data separation
- Users can only see their workspace data

**Vector Search:**
- Uses pgvector extension (built into Supabase)
- 1536-dimensional embeddings (OpenAI ada-002)
- Cosine similarity search with `search_embeddings()` function
- IVFFlat index for fast searches (1M+ vectors)

**Message Counting:**
- Automatic trigger increments `messages_used`
- Only counts when `counts_toward_limit = true`
- Enforces 150 messages/seat/month limit

## 🔍 Vector Search Example

```typescript
import { createClient } from '@/lib/supabase/server';

async function searchKnowledge(query: string, workspaceId: string) {
  const supabase = await createClient();

  // 1. Get embedding for query
  const embedding = await getEmbedding(query); // OpenAI API call

  // 2. Search vectors
  const { data, error } = await supabase.rpc('search_embeddings', {
    query_embedding: embedding,
    workspace_uuid: workspaceId,
    match_threshold: 0.7,
    match_count: 10,
  });

  return data; // Returns relevant chunks with similarity scores
}
```

## 🔐 Security Considerations

**Row Level Security (RLS):**
- All tables have RLS enabled
- Policies ensure users only see their workspace data
- Service role key bypasses RLS (use carefully!)

**API Keys:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe for client-side use
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only, full access

**Authentication:**
- Supabase handles password hashing (bcrypt)
- JWT tokens for session management
- Automatic token refresh via middleware

## 📈 Scaling Considerations

**Free Tier Limits:**
- 500MB database
- 1GB file storage
- 50,000 monthly active users
- 2GB bandwidth

**When to Upgrade:**
- Vector storage can grow quickly (1536 floats × chunks)
- Each 1,000-token chunk ≈ 6KB in vector storage
- 100,000 chunks ≈ 600MB just for vectors

**Pro Tier ($25/mo):**
- 8GB database
- 100GB file storage
- No compute limits
- Daily backups

**Optimization Tips:**
- Use IVFFlat index (already configured)
- Consider HNSW index for even faster search (Postgres 15+)
- Archive old messages to separate table
- Implement pagination for message history

## 🧪 Testing

### Seed Data (Optional)

```sql
-- Create a test workspace
insert into workspaces (name, seats, message_limit)
values ('Test Corp', 5, 750)
returning id;

-- Create a test user (after signing up via auth)
insert into users (id, workspace_id, name, email, role)
values (
  auth.uid(), -- your user ID from signup
  '<workspace-id>',
  'Test User',
  'test@example.com',
  'admin'
);
```

### Verify Vector Search

```sql
-- Check if pgvector is installed
select * from pg_extension where extname = 'vector';

-- Count embeddings
select count(*) from embeddings;

-- Test similarity search (after adding embeddings)
select * from search_embeddings(
  (select embedding from embeddings limit 1),
  '<workspace-id>',
  0.5,
  5
);
```

## 🚨 Common Issues

**Issue: "extension vector not found"**
- Solution: Run `create extension vector;` in SQL Editor

**Issue: "RLS policy violation"**
- Solution: Ensure user is authenticated and workspace_id matches

**Issue: "Function search_embeddings does not exist"**
- Solution: Re-run the schema.sql file

**Issue: Slow vector searches**
- Solution: Index may be building. Check with:
  ```sql
  select * from pg_stat_progress_create_index;
  ```

## 📚 Next Steps

Once Supabase is set up:

1. ✅ Authentication works (sign up / sign in)
2. ✅ Database tables created
3. ✅ Vector search functional
4. ✅ Storage buckets configured

You can now:
- Build the workspace creation flow
- Implement CompanyOS upload & processing
- Add embedding generation pipeline
- Create assistant configuration UI
- Build the real-time messaging system

---

**Need help?** Check [Supabase docs](https://supabase.com/docs) or [pgvector docs](https://github.com/pgvector/pgvector)
