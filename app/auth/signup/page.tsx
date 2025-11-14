'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          workspace_name: workspaceName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Create workspace and user profile
      // This will be handled by a database trigger or Edge Function
      // For now, redirect to setup page
      router.push('/setup');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex lg:w-1/2 bg-background-secondary relative overflow-hidden flex-col justify-between p-12"
      >
        {/* Atmospheric gradient orb */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-ai/20 rounded-full blur-[100px] opacity-20" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-background font-serif font-bold text-xl">
              ⇡
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground">
              upupdnd
            </h1>
          </div>
          <p className="text-foreground-secondary text-sm font-mono">
            Where humans and AI collaborate seamlessly
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-serif font-semibold text-foreground mb-4 leading-tight">
              Deploy AI that knows your{' '}
              <span className="text-accent">business</span>
            </h2>
            <p className="text-foreground-secondary text-lg leading-relaxed">
              Create a workspace for your team. Upload your CompanyOS
              knowledge. Build AI assistants that understand your brand,
              strategy, and context.
            </p>
          </div>

          <div className="space-y-6 bg-background-tertiary/50 rounded-lg p-6 border border-border">
            <div>
              <h3 className="text-foreground font-serif font-semibold mb-3 text-lg">
                How it works
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm">
                  1
                </div>
                <div>
                  <h4 className="text-foreground font-medium mb-1">
                    Create workspace
                  </h4>
                  <p className="text-foreground-secondary text-sm">
                    Set up your team's dedicated environment
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-sm">
                  2
                </div>
                <div>
                  <h4 className="text-foreground font-medium mb-1">
                    Upload CompanyOS
                  </h4>
                  <p className="text-foreground-secondary text-sm">
                    Add brand guides, strategies, playbooks
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-ai/20 border border-ai/30 flex items-center justify-center text-ai font-semibold text-sm">
                  3
                </div>
                <div>
                  <h4 className="text-foreground font-medium mb-1">
                    Build AI assistants
                  </h4>
                  <p className="text-foreground-secondary text-sm">
                    Create specialized agents for each team function
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-ai/20 border border-ai/30 flex items-center justify-center text-ai font-semibold text-sm">
                  4
                </div>
                <div>
                  <h4 className="text-foreground font-medium mb-1">
                    Collaborate in channels
                  </h4>
                  <p className="text-foreground-secondary text-sm">
                    Invite team + AI to channels, @mention for help
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-foreground-tertiary text-xs font-mono">
            $199/seat/month • 150 messages included
          </p>
        </div>
      </motion.div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-3xl font-serif font-semibold text-foreground mb-2">
              Get started
            </h2>
            <p className="text-foreground-secondary">
              Create your workspace in 60 seconds
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Your name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="Sarah Chen"
                required
              />
            </div>

            <div>
              <label
                htmlFor="workspace"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Workspace name
              </label>
              <input
                id="workspace"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="Acme Corp"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-tertiary focus:outline-none focus:border-accent transition-colors font-mono text-sm"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating workspace...' : 'Create workspace'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-foreground-secondary text-sm">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-accent hover:text-accent-hover transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-foreground-tertiary text-xs text-center">
              By signing up, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
