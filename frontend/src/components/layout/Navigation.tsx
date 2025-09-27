'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import Image from 'next/image';
import {
  FileText,
  LogOut,
  User,
  Shield,
  Users,
  BarChart,
  Settings,
  Home,
} from 'lucide-react';
import UserProfile from './UserProfile';
import { NotificationDropdown } from './NotificationDropdown';

// Icon mapping for routes
const iconMap = {
  Shield: Shield,
  FileText: FileText,
  Users: Users,
  User: User,
  BarChart: BarChart,
  Settings: Settings,
  Home: Home,
};

const Navigation = () => {
  const { user, logout, getNavRoutes } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  const navigationRoutes = getNavRoutes();

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[--twilight-gaze]/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-[--twilight-gaze]/20 shadow-sm p-2">
                <Image
                  src="/logo.png"
                  alt="Pillar Logo"
                  width={24}
                  height={24}
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[--twilight-gaze]">
                  Contract Management
                </h1>
                <p className="text-sm text-[--midnight-whisper]/70">
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}{' '}
                  Portal
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationRoutes.map(route => {
                const isActive = pathname === route.path;
                const IconComponent = route.icon
                  ? iconMap[route.icon as keyof typeof iconMap]
                  : FileText;

                return (
                  <Button
                    key={route.path}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => router.push(route.path)}
                    className="flex items-center gap-2"
                  >
                    <IconComponent className="h-4 w-4" />
                    {route.name}
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* User Info and Logout */}

          {/* <UserProfile /> */}
          <div className="flex items-center gap-4">
            <NotificationDropdown />

            <UserProfile
              name={user.name}
              role={user.role}
              handleLogout={logout}
            />

            {/* <NotificationDropdown /> */}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-2">
            {navigationRoutes.map(route => {
              const isActive = pathname === route.path;
              const IconComponent = route.icon
                ? iconMap[route.icon as keyof typeof iconMap]
                : FileText;

              return (
                <Button
                  key={route.path}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => router.push(route.path)}
                  className="flex items-center gap-2"
                >
                  <IconComponent className="h-3 w-3" />
                  {route.name}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
