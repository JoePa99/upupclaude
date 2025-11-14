import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UpUp - AI-Powered Team Collaboration',
  description: 'Where humans and AI assistants collaborate seamlessly',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Atmospheric gradient orbs */}
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />

        {children}
      </body>
    </html>
  );
}
