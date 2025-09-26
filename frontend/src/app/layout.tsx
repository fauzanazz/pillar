import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import AuthGuard from '@/components/auth/AuthGuard';
import './global.css';

export const metadata: Metadata = {
  title: 'iFest 2025 - Contract Management System',
  description:
    'Professional contract management system for legal, internal, and management teams',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthGuard>{children}</AuthGuard>
        <Toaster />
      </body>
    </html>
  );
}
