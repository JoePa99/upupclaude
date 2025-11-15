import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface WorkspaceWithStats {
  id: string;
  name: string;
  created_at: string;
  seats: number;
  messages_used: number;
  message_limit: number;
  assistant_count?: number;
  document_count?: number;
  user_count?: number;
}

export default async function AdminDashboard() {
  // Check auth first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    redirect('/');
  }

  // Use admin client to see ALL platform data
  const adminClient = createAdminClient();

  // Get platform-wide stats
  const [workspacesResult, usersResult, assistantsResult, documentsResult, embeddingsResult, messagesResult] =
    await Promise.all([
      adminClient.from('workspaces').select('*', { count: 'exact', head: true }),
      adminClient.from('users').select('*', { count: 'exact', head: true }),
      adminClient.from('assistants').select('*', { count: 'exact', head: true }),
      adminClient
        .from('company_os_documents')
        .select('*', { count: 'exact', head: true }),
      adminClient.from('embeddings').select('*', { count: 'exact', head: true }),
      adminClient.from('messages').select('*', { count: 'exact', head: true }),
    ]);

  // Get all workspaces with details
  const { data: workspacesData } = await adminClient
    .from('workspaces')
    .select('*')
    .order('created_at', { ascending: false });

  const workspaces = workspacesData as WorkspaceWithStats[] | null;

  // Get counts for each workspace
  const workspacesWithStats = await Promise.all(
    (workspaces || []).map(async (workspace) => {
      const [assistants, documents, users] = await Promise.all([
        adminClient.from('assistants').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
        adminClient.from('company_os_documents').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
        adminClient.from('users').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace.id),
      ]);

      return {
        ...workspace,
        assistant_count: assistants.count || 0,
        document_count: documents.count || 0,
        user_count: users.count || 0,
      };
    })
  );

  const platformStats = [
    {
      label: 'Total Companies',
      value: workspacesResult.count || 0,
      description: 'Active workspaces',
    },
    { label: 'Total Users', value: usersResult.count || 0, description: 'Across all companies' },
    {
      label: 'AI Assistants',
      value: assistantsResult.count || 0,
      description: 'Total created',
    },
    {
      label: 'Documents',
      value: documentsResult.count || 0,
      description: 'CompanyOS files',
    },
    {
      label: 'Embeddings',
      value: embeddingsResult.count || 0,
      description: 'Vector chunks',
    },
    {
      label: 'Messages',
      value: messagesResult.count || 0,
      description: 'Total sent',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          Platform Overview
        </h2>
        <p className="text-sm text-foreground-secondary">
          Manage companies and monitor platform-wide metrics
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platformStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-background-secondary border border-border rounded-lg p-6"
          >
            <div className="text-3xl font-serif font-semibold text-accent mb-2">
              {stat.value.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-foreground mb-1">
              {stat.label}
            </div>
            <div className="text-xs text-foreground-tertiary">
              {stat.description}
            </div>
          </div>
        ))}
      </div>

      {/* Companies List */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            Companies
          </h3>
          <p className="text-sm text-foreground-secondary">
            Click on a company to manage their assistants, documents, and users
          </p>
        </div>

        <div className="divide-y divide-border">
          {workspacesWithStats.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
              No companies found
            </div>
          ) : (
            workspacesWithStats.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/admin/companies/${workspace.id}`}
                className="block px-6 py-4 hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground mb-1">
                      {workspace.name}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-foreground-tertiary">
                      <span>{workspace.user_count} users</span>
                      <span>•</span>
                      <span>{workspace.assistant_count} assistants</span>
                      <span>•</span>
                      <span>{workspace.document_count} documents</span>
                      <span>•</span>
                      <span>
                        {workspace.messages_used.toLocaleString()} / {workspace.message_limit.toLocaleString()} messages
                      </span>
                    </div>
                  </div>
                  <div className="text-accent text-sm">
                    View →
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
