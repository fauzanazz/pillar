'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { getDefaultRoute } from '@/config/routes';
import type { UserRole } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, LogOut } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleGoToDashboard = () => {
    if (user) {
      const defaultRoute = getDefaultRoute(user.role as UserRole);
      router.push(defaultRoute);
    } else {
      router.push('/login');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Access Denied
          </CardTitle>
          <CardDescription>
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {user && (
            <div className="text-center text-sm text-gray-600">
              Signed in as: <span className="font-medium">{user.name}</span> ({user.role})
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={handleGoToDashboard}
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              {user ? 'Go to Dashboard' : 'Go to Login'}
            </Button>

            {user && (
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}