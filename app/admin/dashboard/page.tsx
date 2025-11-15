import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  // Check auth first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    redirect('/');
  }

  // Use admin client to see ALL platform data
  const adminClient = createAdminClient();

  // Get system stats using admin client to see ALL data across ALL workspaces
  const [workspaces, users, assistants, documents, embeddings, messages] =
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

  const stats = [
    {
      label: 'Workspaces',
      value: workspaces.count || 0,
      description: 'Total companies',
    },
    { label: 'Users', value: users.count || 0, description: 'Across all workspaces' },
    {
      label: 'AI Assistants',
      value: assistants.count || 0,
      description: 'Total created',
    },
    {
      label: 'Documents',
      value: documents.count || 0,
      description: 'CompanyOS files',
    },
    {
      label: 'Embeddings',
      value: embeddings.count || 0,
      description: 'Vector chunks',
    },
    {
      label: 'Messages',
      value: messages.count || 0,
      description: 'Total sent',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          System Overview
        </h2>
        <p className="text-sm text-foreground-secondary">
          Platform-wide statistics and health metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
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

      {/* Quick Actions */}
      <div className="bg-background-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/documents"
            className="block p-4 bg-background border border-border rounded hover:border-accent transition-colors"
          >
            <div className="text-sm font-medium text-foreground mb-1">
              Upload Document
            </div>
            <div className="text-xs text-foreground-tertiary">
              Add new CompanyOS documents
            </div>
          </a>
          <a
            href="/admin/embeddings"
            className="block p-4 bg-background border border-border rounded hover:border-accent transition-colors"
          >
            <div className="text-sm font-medium text-foreground mb-1">
              Process Embeddings
            </div>
            <div className="text-xs text-foreground-tertiary">
              Generate vectors for new content
            </div>
          </a>
          <a
            href="/admin/workspaces"
            className="block p-4 bg-background border border-border rounded hover:border-accent transition-colors"
          >
            <div className="text-sm font-medium text-foreground mb-1">
              Manage Workspaces
            </div>
            <div className="text-xs text-foreground-tertiary">
              View and edit company settings
            </div>
          </a>
          <a
            href="/admin/users"
            className="block p-4 bg-background border border-border rounded hover:border-accent transition-colors"
          >
            <div className="text-sm font-medium text-foreground mb-1">
              View Users
            </div>
            <div className="text-xs text-foreground-tertiary">
              Manage user accounts
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
