import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSuperAdmin } from '@/lib/admin';
import { redirect } from 'next/navigation';

interface Embedding {
  id: string;
  source_type: string;
  content: string;
  created_at: string;
  metadata?: {
    source?: string;
    page?: number;
  };
}

export default async function AdminEmbeddings() {
  // Check auth first
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isSuperAdmin(user.email)) {
    redirect('/');
  }

  // Use admin client to see ALL embeddings across the platform
  const adminClient = createAdminClient();

  // Get embedding stats by source type
  const { data: stats } = await adminClient
    .from('embeddings')
    .select('source_type, workspace_id')
    .order('created_at', { ascending: false });

  // Aggregate by source type
  const aggregated = (stats as Array<{ source_type: string; workspace_id: string }> | null)?.reduce(
    (acc, item) => {
      acc[item.source_type] = (acc[item.source_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statCards = [
    {
      label: 'CompanyOS Chunks',
      value: aggregated?.company_os || 0,
      description: 'Foundation knowledge',
    },
    {
      label: 'Agent Docs',
      value: aggregated?.agent_doc || 0,
      description: 'Specialized knowledge',
    },
    {
      label: 'Playbooks',
      value: aggregated?.playbook || 0,
      description: 'Team-contributed',
    },
  ];

  // Get recent embeddings
  const { data: recentEmbeddingsData } = await adminClient
    .from('embeddings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  const recentEmbeddings = recentEmbeddingsData as Embedding[] | null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
          Embeddings Management
        </h2>
        <p className="text-sm text-foreground-secondary">
          Monitor and manage vector embeddings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
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

      {/* Recent Embeddings */}
      <div className="bg-background-secondary border border-border rounded-lg p-6">
        <h3 className="text-lg font-serif font-semibold text-foreground mb-4">
          Recent Embeddings
        </h3>

        <div className="space-y-4">
          {recentEmbeddings?.map((embedding) => (
            <div
              key={embedding.id}
              className="bg-background border border-border rounded p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-accent/20 border border-accent/30 rounded text-xs text-accent">
                    {embedding.source_type}
                  </span>
                  <span className="text-xs text-foreground-tertiary">
                    {embedding.id.substring(0, 8)}...
                  </span>
                </div>
                <span className="text-xs text-foreground-tertiary">
                  {new Date(embedding.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-foreground line-clamp-2">
                {embedding.content}
              </div>
              {embedding.metadata && (
                <div className="mt-2 text-xs text-foreground-tertiary">
                  Source: {embedding.metadata.source || 'Unknown'}
                  {embedding.metadata.page && ` (p.${embedding.metadata.page})`}
                </div>
              )}
            </div>
          ))}
          {(!recentEmbeddings || recentEmbeddings.length === 0) && (
            <div className="text-center py-8 text-sm text-foreground-tertiary">
              No embeddings found. Upload documents to generate embeddings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
