-- Add DM channel support to channels table
alter table channels
  add column if not exists is_dm boolean default false,
  add column if not exists dm_assistant_id uuid references assistants(id);

-- RLS policies for channel CRUD operations
create policy if not exists "Users can create channels in their workspace"
  on channels for insert
  with check (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy if not exists "Users can update channels in their workspace"
  on channels for update
  using (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

create policy if not exists "Users can delete channels in their workspace"
  on channels for delete
  using (workspace_id in (
    select workspace_id from users where id = auth.uid()
  ));

-- RLS policies for channel members
create policy if not exists "Users can view channel members"
  on channel_members for select
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy if not exists "Users can add channel members"
  on channel_members for insert
  with check (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy if not exists "Users can remove channel members"
  on channel_members for delete
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

-- RLS policies for channel assistants
create policy if not exists "Users can view channel assistants"
  on channel_assistants for select
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy if not exists "Users can add channel assistants"
  on channel_assistants for insert
  with check (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));

create policy if not exists "Users can remove channel assistants"
  on channel_assistants for delete
  using (channel_id in (
    select id from channels where workspace_id in (
      select workspace_id from users where id = auth.uid()
    )
  ));
