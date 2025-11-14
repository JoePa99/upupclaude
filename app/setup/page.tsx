'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Setup() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setupWorkspace();
  }, []);

  const setupWorkspace = async () => {
    try {
      // Get user data from auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Get metadata from signup
      const workspaceName = user.user_metadata?.workspace_name || 'My Workspace';
      const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';

      // Create workspace via API
      const response = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceName,
          userName,
          seats: 5, // Default 5 seats for new workspaces
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create workspace');
      }

      // Success! Redirect to main app
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2000);
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-2xl mx-auto mb-4">
            ✕
          </div>
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Setup failed
          </h2>
          <p className="text-foreground-secondary mb-6">{error}</p>
          <button
            onClick={() => router.push('/auth/signin')}
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-background font-semibold rounded-lg transition-all"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Animated logo */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-20 h-20 rounded-lg bg-accent flex items-center justify-center text-background font-serif font-bold text-3xl mx-auto mb-6"
        >
          ⇡
        </motion.div>

        <h2 className="text-3xl font-serif font-semibold text-foreground mb-3">
          Setting up your workspace
        </h2>

        <div className="space-y-3 mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-foreground-secondary"
          >
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span>Creating your workspace...</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 text-foreground-secondary"
          >
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span>Setting up channels...</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3 text-foreground-secondary"
          >
            <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <span>Preparing your environment...</span>
          </motion.div>
        </div>

        <p className="text-foreground-tertiary text-sm">
          This will only take a moment
        </p>
      </motion.div>
    </div>
  );
}
