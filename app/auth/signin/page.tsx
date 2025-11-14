'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
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
              UpUp
            </h1>
          </div>
          <p className="text-foreground-secondary text-sm font-mono">
            Where humans and AI collaborate seamlessly
          </p>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-serif font-semibold text-foreground mb-4 leading-tight">
              AI-powered team collaboration that feels{' '}
              <span className="text-accent">magical</span>
            </h2>
            <p className="text-foreground-secondary text-lg leading-relaxed">
              Deploy custom AI assistants trained on your company knowledge.
              Chat alongside your team in channels. Get context-rich responses
              instantly.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-ai/20 border border-ai/30 flex items-center justify-center text-ai text-sm flex-shrink-0 mt-1">
                ◆
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  CompanyOS Foundation
                </h3>
                <p className="text-foreground-secondary text-sm">
                  Upload your brand guides, strategies, and playbooks. Every AI
                  assistant has this knowledge built-in.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm flex-shrink-0 mt-1">
                #
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Channel Collaboration
                </h3>
                <p className="text-foreground-secondary text-sm">
                  Create channels, invite team members and AI assistants. @mention
                  to get intelligent, context-aware responses.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm flex-shrink-0 mt-1">
                ∞
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-1">
                  Multi-Model Intelligence
                </h3>
                <p className="text-foreground-secondary text-sm">
                  Choose from GPT-4, Claude, or Gemini for each assistant.
                  Pick the best model for each use case.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-foreground-tertiary text-xs font-mono">
            Built with care to avoid the "AI slop" aesthetic
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
              Welcome back
            </h2>
            <p className="text-foreground-secondary">
              Sign in to your workspace
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Email
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
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-foreground-secondary text-sm">
              Don't have an account?{' '}
              <Link
                href="/auth/signup"
                className="text-accent hover:text-accent-hover transition-colors font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-foreground-tertiary text-xs text-center">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
