-- Fix for infinite recursion in RLS policies
-- Run this AFTER the main schema.sql

-- Drop problematic policies
drop policy if exists "Users can view users in their workspace" on users;
drop policy if exists "Users can view their workspace" on workspaces;
drop policy if exists "Users can view assistants in their workspace" on assistants;
drop policy if exists "Users can view channels in their workspace" on channels;
drop policy if exists "Users can view messages in their channels" on messages;

-- Better policies that avoid recursion

-- Users table: Allow users to see themselves and insert their own profile
create policy "Users can view their own profile"
  on users for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on users for update
  using (auth.uid() = id);

-- Workspaces: Users can view and insert workspaces they created
create policy "Users can view workspaces they belong to"
  on workspaces for select
  using (
    id in (
      select workspace_id from users where id = auth.uid()
    )
  );

create policy "Users can create workspaces"
  on workspaces for insert
  with check (true);  -- Any authenticated user can create

create policy "Users can update their workspace"
  on workspaces for update
  using (
    id in (
      select workspace_id from users where id = auth.uid()
    )
  );

-- Channels: Users can manage channels in their workspace
create policy "Users can view channels in their workspace"
  on channels for select
  using (
    workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  );

create policy "Users can create channels in their workspace"
  on channels for insert
  with check (
    workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  );

-- Channel members
create policy "Users can view channel members"
  on channel_members for select
  using (
    channel_id in (
      select id from channels where workspace_id in (
        select workspace_id from users where id = auth.uid()
      )
    )
  );

create policy "Users can join channels"
  on channel_members for insert
  with check (
    channel_id in (
      select id from channels where workspace_id in (
        select workspace_id from users where id = auth.uid()
      )
    )
  );

-- Messages: Users can view and create messages in their channels
create policy "Users can view messages in their workspace"
  on messages for select
  using (
    channel_id in (
      select id from channels where workspace_id in (
        select workspace_id from users where id = auth.uid()
      )
    )
  );

create policy "Users can create messages in their channels"
  on messages for insert
  with check (
    channel_id in (
      select id from channels where workspace_id in (
        select workspace_id from users where id = auth.uid()
      )
    )
  );

-- Assistants: View only
create policy "Users can view assistants in their workspace"
  on assistants for select
  using (
    workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  );

-- Allow service role to bypass all policies for setup operations
-- (This is already the default, but making it explicit)
