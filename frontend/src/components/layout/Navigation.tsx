'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
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
              <div className="h-8 w-8 bg-accent rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Contract Management
                </h1>
                <p className="text-sm text-gray-600">
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">{user.name}</span>
              <span className="text-gray-500 capitalize">({user.role})</span>
            </div>

            <NotificationDropdown />

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
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
