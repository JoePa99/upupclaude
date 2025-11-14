-- Enable Realtime for messages table
-- This allows the frontend to receive live updates when messages are inserted

-- Enable Realtime replication for the messages table
alter publication supabase_realtime add table messages;

-- Optional: Enable for other tables you might want real-time updates on
alter publication supabase_realtime add table channel_members;
alter publication supabase_realtime add table assistants;
