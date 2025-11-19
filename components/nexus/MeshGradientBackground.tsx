'use client';

import { motion } from 'framer-motion';

/**
 * Luminous Glass Background - Breathing mesh gradient
 * Cyan/Coral/Purple/Yellow gradients moving slowly
 */
export function MeshGradientBackground() {
  return (
    <div className="fixed inset-0 bg-luminous-bg overflow-hidden pointer-events-none">
      {/* Animated mesh gradient */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(86, 227, 255, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(198, 88, 255, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 40% 80%, rgba(255, 90, 95, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 20%, rgba(255, 193, 7, 0.3) 0%, transparent 50%)
          `,
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Secondary animated layer for depth */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(ellipse at 60% 50%, rgba(86, 227, 255, 0.3) 0%, transparent 60%),
            radial-gradient(ellipse at 30% 60%, rgba(255, 90, 95, 0.25) 0%, transparent 60%)
          `,
        }}
        animate={{
          scale: [1.1, 1, 1.1],
          rotate: [0, -3, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
}
