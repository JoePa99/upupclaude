import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface Assistant {
  id: string;
  name: string;
  role: string;
  model: string;
  created_at: string;
}

interface Document {
  id: string;
  filename: string;
  status: string;
  file_size: number;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
}

export default async function CompanyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    redirect('/');
  }

  const adminClient = createAdminClient();
  const workspaceId = params.id;

  // Get workspace details
  const { data: workspace } = await adminClient
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single();

  if (!workspace) {
    redirect('/admin/dashboard');
  }

  // Get company data
  const [assistantsData, documentsData, usersData, embeddingsCount] = await Promise.all([
    adminClient
      .from('assistants')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    adminClient
      .from('company_os_documents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    adminClient
      .from('users')
      .select('id, email, full_name, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
    adminClient
      .from('embeddings')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId),
  ]);

  const assistants = assistantsData.data as Assistant[] | null;
  const documents = documentsData.data as Document[] | null;
  const users = usersData.data as User[] | null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-accent hover:text-accent/80 mb-2 inline-block"
        >
          ← Back to Companies
        </Link>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          {workspace.name}
        </h2>
        <div className="flex items-center gap-4 text-sm text-foreground-secondary">
          <span>{users?.length || 0} users</span>
          <span>•</span>
          <span>{assistants?.length || 0} assistants</span>
          <span>•</span>
          <span>{documents?.length || 0} documents</span>
          <span>•</span>
          <span>{embeddingsCount.count || 0} embeddings</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            {workspace.seats}
          </div>
          <div className="text-sm text-foreground-secondary">Seats</div>
        </div>
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            {workspace.messages_used.toLocaleString()}
          </div>
          <div className="text-sm text-foreground-secondary">
            Messages Used (of {workspace.message_limit.toLocaleString()})
          </div>
        </div>
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            ${(workspace.price_per_seat / 100).toFixed(2)}
          </div>
          <div className="text-sm text-foreground-secondary">Price per Seat</div>
        </div>
        <div className="bg-background-secondary border border-border rounded-lg p-6">
          <div className="text-2xl font-serif font-semibold text-accent mb-1">
            {new Date(workspace.created_at).toLocaleDateString()}
          </div>
          <div className="text-sm text-foreground-secondary">Created</div>
        </div>
      </div>

      {/* Assistants */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            AI Assistants
          </h3>
          <Link
            href={`/admin/companies/${workspaceId}/assistants/create`}
            className="px-4 py-2 bg-accent text-background rounded text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Create Assistant
          </Link>
        </div>

        {!assistants || assistants.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
            No assistants created yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Model
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assistants.map((assistant) => (
                <tr key={assistant.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {assistant.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {assistant.role}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground font-mono">
                    {assistant.model}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground-secondary">
                    {new Date(assistant.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Documents */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            CompanyOS Documents
          </h3>
          <Link
            href={`/admin/companies/${workspaceId}/documents/upload`}
            className="px-4 py-2 bg-accent text-background rounded text-sm font-medium hover:bg-accent/90 transition-colors"
          >
            Upload Document
          </Link>
        </div>

        {!documents || documents.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
            No documents uploaded yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Filename
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Size
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {doc.filename}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {(doc.file_size / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        doc.status === 'ready'
                          ? 'bg-green-500/20 text-green-600 border border-green-500/30'
                          : doc.status === 'processing'
                            ? 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                            : 'bg-red-500/20 text-red-600 border border-red-500/30'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground-secondary">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Users */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-serif font-semibold text-foreground">
            Users
          </h3>
        </div>

        {!users || users.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-foreground-tertiary">
            No users in this workspace
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Email
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 text-sm text-foreground">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground">
                    {user.full_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground-secondary">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
