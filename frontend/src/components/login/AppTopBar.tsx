'use client';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

export function AppTopbar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  return (
    <header className="w-full bg-[#1c212d] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-[#f6d954]" />
          <span className="font-semibold">People • Contracts</span>
          <Separator orientation="vertical" className="mx-2 h-6 bg-white/20" />
          <nav className="hidden gap-4 md:flex">
            <Link
              className={`text-sm ${pathname.startsWith('/internal') ? 'font-semibold' : ''}`}
              href="/internal"
            >
              Internal
            </Link>
            <Link
              className={`text-sm ${pathname.startsWith('/legal') ? 'font-semibold' : ''}`}
              href="/legal"
            >
              Legal
            </Link>
            <Link
              className={`text-sm ${pathname.startsWith('/management') ? 'font-semibold' : ''}`}
              href="/management"
            >
              Management
            </Link>
            <Link
              className={`text-sm ${pathname.startsWith('/notifications') ? 'font-semibold' : ''}`}
              href="/notifications"
            >
              Notifications
            </Link>
            <Link
              className={`text-sm ${pathname.startsWith('/statistics') ? 'font-semibold' : ''}`}
              href="/statistics"
            >
              Statistics
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/80 md:inline">
            {user?.name} {user?.role ? `(${user.role})` : ''}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <Button variant="secondary" onClick={logout} asChild>
            <Link href="/login">Logout</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
