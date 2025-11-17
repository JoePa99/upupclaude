-- Enable pgvector extension for vector similarity search
create extension if not exists vector;

-- Workspaces (multi-tenant isolation)
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Subscription info
  seats integer not null default 0,
  price_per_seat integer not null default 199, -- in cents
  message_limit integer not null default 0, -- seats * 150
  messages_used integer not null default 0,
  billing_cycle_start timestamptz default now()
);

-- Users (team members)
create table users (
  id uuid primary key references auth.users(id),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('consultant', 'assistant_creator', 'admin', 'member')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI Assistants
create table assistants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  role text not null, -- description of assistant's purpose
  system_prompt text not null,

  -- Model configuration
  model_provider text not null check (model_provider in ('openai', 'anthropic', 'google')),
  model_name text not null,
  temperature real default 0.7,
  max_tokens integer default 2000,

  avatar_url text,
  status text default 'online' check (status in ('online', 'offline')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references users(id)
);

-- Channels (Slack-like channels)
create table channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  is_private boolean default false,
  is_dm boolean default false,
  dm_assistant_id uuid references assistants(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references users(id)
);

-- Channel members (users in channels)
create table channel_members (
  channel_id uuid references channels(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (channel_id, user_id)
);

-- Channel assistants (AI assistants in channels)
create table channel_assistants (
  channel_id uuid references channels(id) on delete cascade,
  assistant_id uuid references assistants(id) on delete cascade,
  added_at timestamptz default now(),
  primary key (channel_id, assistant_id)
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade,
  author_id uuid not null, -- references users(id) or assistants(id)
  author_type text not null check (author_type in ('human', 'assistant')),
  content text not null,
  mentions text[] default '{}', -- array of assistant IDs mentioned
  counts_toward_limit boolean default false,
  created_at timestamptz default now()
);

-- CompanyOS documents (foundational knowledge)
create table company_os_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  filename text not null,
  file_size integer not null,
  mime_type text not null,
  storage_path text not null, -- Supabase storage path

  -- Processing metadata
  status text default 'processing' check (status in ('processing', 'ready', 'failed')),
  total_pages integer,
  total_chunks integer,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  uploaded_by uuid references users(id)
);

-- Agent-specific documents
create table agent_documents (
  id uuid primary key default gen_random_uuid(),
  assistant_id uuid references assistants(id) on delete cascade,
  filename text not null,
  file_size integer not null,
  mime_type text not null,
  storage_path text not null,

  status text default 'processing' check (status in ('processing', 'ready', 'failed')),
  total_pages integer,
  total_chunks integer,

  created_at timestamptz default now(),
  uploaded_by uuid references users(id)
);

-- Playbooks (team-contributed knowledge)
create table playbooks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references users(id)
);

-- Playbook documents
create table playbook_documents (
  id uuid primary key default gen_random_uuid(),
  playbook_id uuid references playbooks(id) on delete cascade,
  filename text not null,
  file_size integer not null,
  mime_type text not null,
  storage_path text not null,

  status text default 'processing' check (status in ('processing', 'ready', 'failed')),
  total_pages integer,
  total_chunks integer,

  created_at timestamptz default now(),
  uploaded_by uuid references users(id)
);

-- Vector embeddings (unified storage for all knowledge chunks)
create table embeddings (
  id uuid primary key default gen_random_uuid(),

  -- Source tracking
  source_type text not null check (source_type in ('company_os', 'agent_doc', 'playbook')),
  source_id uuid not null, -- references document ID from respective table
  workspace_id uuid references workspaces(id) on delete cascade,
  assistant_id uuid references assistants(id), -- null for company_os and playbooks

  -- Content
  content text not null,
  metadata jsonb default '{}', -- page number, section, etc.

  -- Vector embedding (1536 dimensions for OpenAI ada-002)
  embedding vector(1536),

  created_at timestamptz default now()
);

-- Create index for vector similarity search
create index on embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Create indexes for performance
create index on messages (channel_id, created_at desc);
create index on messages (author_id);
create index on embeddings (workspace_id);
create index on embeddings (source_type, source_id);
create index on users (workspace_id);
create index on assistants (workspace_id);
create index on channels (workspace_id);

-- Row Level Security (RLS) Policies
alter table workspaces enable row level security;
alter table users enable row level security;
alter table assistants enable row level security;
alter table channels enable row level security;
alter table channel_members enable row level security;
alter table channel_assistants enable row level security;
alter table messages enable row level security;
alter table company_os_documents enable row level security;
alter table agent_documents enable row level security;
alter table playbooks enable row level security;
alter table playbook_documents enable row level security;
alter table embeddings enable row level security;

-- Users can only see data from their workspace
create policy "Users can view their workspace"
  on workspaces for select
  using (id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy "Users can view users in their workspace"
  on users for select
  using (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy "Users can view assistants in their workspace"
  on assistants for select
  using (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy "Users can view channels in their workspace"
  on channels for select
  using (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy "Users can create channels in their workspace"
  on channels for insert
  with check (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy "Users can update channels in their workspace"
  on channels for update
  using (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy "Users can delete channels in their workspace"
  on channels for delete
  using (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy "Users can view channel members"
  on channel_members for select
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy "Users can add channel members"
  on channel_members for insert
  with check (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy "Users can remove channel members"
  on channel_members for delete
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy "Users can view channel assistants"
  on channel_assistants for select
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy "Users can add channel assistants"
  on channel_assistants for insert
  with check (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy "Users can remove channel assistants"
  on channel_assistants for delete
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy "Users can view messages in their channels"
  on messages for select
  using (channel_id in (
    select channel_id from channel_members where user_id = auth.uid()
  ));

-- Function to search embeddings with vector similarity
create or replace function search_embeddings(
  query_embedding vector(1536),
  workspace_uuid uuid,
  match_threshold float default 0.7,
  match_count int default 10,
  filter_source_type text default null,
  filter_assistant_id uuid default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  source_type text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    embeddings.id,
    embeddings.content,
    embeddings.metadata,
    embeddings.source_type,
    1 - (embeddings.embedding <=> query_embedding) as similarity
  from embeddings
  where embeddings.workspace_id = workspace_uuid
    and (filter_source_type is null or embeddings.source_type = filter_source_type)
    and (filter_assistant_id is null or embeddings.assistant_id = filter_assistant_id or embeddings.assistant_id is null)
    and 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  order by embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Function to update message count
create or replace function increment_message_count()
returns trigger as $$
begin
  if new.counts_toward_limit then
    update workspaces
    set messages_used = messages_used + 1
    where id = (
      select workspace_id from channels where id = new.channel_id
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger increment_workspace_message_count
  after insert on messages
  for each row
  execute function increment_message_count();

-- Function to update timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_workspaces_updated_at
  before update on workspaces
  for each row
  execute function update_updated_at();

create trigger update_users_updated_at
  before update on users
  for each row
  execute function update_updated_at();

create trigger update_assistants_updated_at
  before update on assistants
  for each row
  execute function update_updated_at();

create trigger update_channels_updated_at
  before update on channels
  for each row
  execute function update_updated_at();
