import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSuperAdmin } from '@/lib/admin';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check superadmin access
  if (!isSuperAdmin(user.email)) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="border-b border-border bg-background-secondary">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-serif font-semibold text-accent">
                Admin Panel
              </h1>
              <nav className="flex gap-6">
                <Link
                  href="/admin/dashboard"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/workspaces"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Workspaces
                </Link>
                <Link
                  href="/admin/documents"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Documents
                </Link>
                <Link
                  href="/admin/embeddings"
                  className="text-sm text-foreground-secondary hover:text-foreground transition-colors"
                >
                  Embeddings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-foreground-tertiary">
                {user.email}
              </span>
              <Link
                href="/"
                className="text-xs text-accent hover:text-accent/80 transition-colors"
              >
                ← Back to App
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
