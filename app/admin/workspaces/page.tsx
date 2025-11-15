import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  seats: number;
  price_per_seat: number;
  messages_used: number;
  message_limit: number;
  created_at: string;
}

export default async function AdminWorkspaces() {
  // Check auth first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    redirect('/');
  }

  // Use admin client to see ALL workspaces across the platform
  const adminClient = createAdminClient();

  const { data: workspacesData } = await adminClient
    .from('workspaces')
    .select('*, users(count)')
    .order('created_at', { ascending: false });

  const workspaces = workspacesData as Workspace[] | null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          Workspace Management
        </h2>
        <p className="text-sm text-foreground-secondary">
          Manage all company workspaces
        </p>
      </div>

      {/* Workspaces Table */}
      <div className="bg-background-secondary border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-background border-b border-border">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Workspace
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Seats
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Price/Seat
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Messages
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Created
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-foreground-secondary uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {workspaces?.map((workspace) => (
              <tr key={workspace.id} className="hover:bg-background/50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-foreground">
                    {workspace.name}
                  </div>
                  <div className="text-xs text-foreground-tertiary">
                    {workspace.id}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {workspace.seats}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  ${(workspace.price_per_seat / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">
                  {workspace.messages_used} / {workspace.message_limit}
                </td>
                <td className="px-6 py-4 text-sm text-foreground-secondary">
                  {new Date(workspace.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <button className="text-accent hover:text-accent/80 transition-colors">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
            {(!workspaces || workspaces.length === 0) && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-sm text-foreground-tertiary"
                >
                  No workspaces found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
